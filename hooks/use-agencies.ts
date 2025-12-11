import useSWR, { SWRConfiguration } from 'swr';
import {
  AgenciesApiResponse,
  AgenciesQueryParams,
  ErrorResponse,
  isErrorResponse,
  API_CONSTANTS,
} from '@/types/api';

/**
 * Custom hook for fetching agency data from the API
 *
 * This hook provides a reusable interface for fetching agency data with:
 * - Automatic caching and revalidation via SWR
 * - Loading and error states
 * - Query parameter support
 * - Automatic retry logic for failed requests
 * - TypeScript type safety
 */

/**
 * Builds a query string from the provided parameters
 */
function buildQueryString(params: AgenciesQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.trades && params.trades.length > 0) {
    params.trades.forEach((trade) => {
      searchParams.append('trades[]', trade);
    });
  }

  if (params.states && params.states.length > 0) {
    params.states.forEach((state) => {
      searchParams.append('states[]', state);
    });
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit.toString());
  }

  if (params.offset !== undefined) {
    searchParams.set('offset', params.offset.toString());
  }

  return searchParams.toString();
}

/**
 * Fetcher function for SWR
 */
async function fetcher(url: string): Promise<AgenciesApiResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch agencies');
  }

  return response.json();
}

/**
 * Hook return type
 */
export interface UseAgenciesReturn {
  /** Agency data from the API */
  data: AgenciesApiResponse | undefined;
  /** Error object if the request failed */
  error: Error | undefined;
  /** Whether the request is currently loading */
  isLoading: boolean;
  /** Whether the request is validating (reloading in background) */
  isValidating: boolean;
  /** Function to manually trigger a revalidation */
  mutate: () => void;
}

/**
 * Hook options
 */
export interface UseAgenciesOptions extends AgenciesQueryParams {
  /** Whether to enable the request (default: true) */
  enabled?: boolean;
  /** SWR configuration options */
  swrOptions?: SWRConfiguration<AgenciesApiResponse>;
}

/**
 * Custom hook for fetching agencies with query parameters
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, error, isLoading } = useAgencies();
 *
 * // With search
 * const { data, error, isLoading } = useAgencies({
 *   search: 'construction',
 * });
 *
 * // With filters
 * const { data, error, isLoading } = useAgencies({
 *   trades: ['electricians', 'plumbers'],
 *   states: ['TX', 'CA'],
 *   limit: 20,
 *   offset: 0,
 * });
 *
 * // Disabled until ready
 * const { data, error, isLoading } = useAgencies({
 *   search: searchTerm,
 *   enabled: !!searchTerm,
 * });
 * ```
 */
export function useAgencies(
  options: UseAgenciesOptions = {}
): UseAgenciesReturn {
  const {
    search,
    trades,
    states,
    limit = API_CONSTANTS.DEFAULT_LIMIT,
    offset = API_CONSTANTS.DEFAULT_OFFSET,
    enabled = true,
    swrOptions = {},
  } = options;

  // Build query parameters
  const queryParams: AgenciesQueryParams = {
    search,
    trades,
    states,
    limit,
    offset,
  };

  const queryString = buildQueryString(queryParams);
  const url = `/api/agencies${queryString ? `?${queryString}` : ''}`;

  // Use SWR for data fetching
  const { data, error, isValidating, mutate } = useSWR<
    AgenciesApiResponse,
    Error
  >(enabled ? url : null, fetcher, {
    // Default SWR options
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    dedupingInterval: 2000,
    ...swrOptions,
  });

  return {
    data,
    error,
    isLoading: !data && !error && enabled,
    isValidating,
    mutate: () => mutate(),
  };
}

/**
 * Hook for fetching a single agency by slug
 * This can be used for agency profile pages
 */
export function useAgency(
  slug: string | undefined,
  options: SWRConfiguration<AgenciesApiResponse> = {}
) {
  const url = slug
    ? `/api/agencies?search=${encodeURIComponent(slug)}&limit=1`
    : null;

  const { data, error, isValidating, mutate } = useSWR<
    AgenciesApiResponse,
    Error
  >(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    ...options,
  });

  // Extract the first agency from the response
  const agency = data?.data?.[0];

  return {
    agency,
    error,
    isLoading: !data && !error && !!slug,
    isValidating,
    mutate: () => mutate(),
  };
}
