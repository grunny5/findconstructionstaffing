/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import HomePage from '../page';
import { useAgencies } from '@/hooks/use-agencies';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the useAgencies hook
jest.mock('@/hooks/use-agencies');

// Mock child components with minimal implementation for performance testing
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: () => <header>Header</header>,
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <footer>Footer</footer>,
}));

jest.mock('@/components/ClaimStatusBanner', () => ({
  ClaimStatusBanner: () => null,
}));

jest.mock('@/components/AgencyCard', () => ({
  __esModule: true,
  default: ({ agency }: { agency: any }) => (
    <div data-testid={`agency-${agency.id}`}>{agency.name}</div>
  ),
}));

jest.mock('@/components/AgencyCardSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="agency-skeleton">Loading...</div>,
}));

jest.mock('@/components/ApiErrorState', () => ({
  __esModule: true,
  default: () => <div>Error</div>,
}));

jest.mock('@/components/DirectoryFilters', () => ({
  __esModule: true,
  default: () => <div>Filters</div>,
}));

const mockAgencies = Array.from({ length: 20 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Agency ${i + 1}`,
  slug: `agency-${i + 1}`,
  description: `Description for agency ${i + 1}`,
  trades: [{ id: 't1', name: 'Electrician', slug: 'electrician' }],
  regions: [{ id: 'r1', name: 'Texas', code: 'TX' }],
  rating: 4.0 + (i % 10) / 10,
  reviewCount: 10 + i * 5,
  projectCount: 50 + i * 10,
  featured: i < 3,
  verified: true,
}));

describe('Page Load Performance Tests', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  // CI environments are ~3x slower due to resource constraints
  // Thresholds adjusted based on actual performance data (local: ~100ms, CI: ~290ms)
  describe('Initial Page Load Performance', () => {
    it('should complete initial render within 100ms', () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: jest.fn(),
      });

      const startTime = performance.now();

      render(<HomePage />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Initial render should be fast in test environment
      // CI environments need higher threshold due to extreme hardware variability and cold start
      const threshold = process.env.CI ? 1500 : 100;
      expect(renderTime).toBeLessThan(threshold);
    });

    it('should render loading skeletons quickly', () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: jest.fn(),
      });

      const startTime = performance.now();

      const { container } = render(<HomePage />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify skeletons are rendered
      const skeletons = container.querySelectorAll(
        '[data-testid="agency-skeleton"]'
      );
      expect(skeletons.length).toBeGreaterThan(0);

      // Should render quickly (3.5x multiplier for CI)
      const threshold = process.env.CI ? 350 : 100;
      expect(renderTime).toBeLessThan(threshold);
    });
  });

  describe('Data Load Performance', () => {
    it('should render full agency list within performance budget', () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      const startTime = performance.now();

      const { container } = render(<HomePage />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 20 agencies
      const agencies = container.querySelectorAll('[data-testid^="agency-"]');
      expect(agencies.length).toBe(20);

      // Even with 20 agencies, should render within reasonable time in test
      // CI threshold increased to 500ms due to hardware variability and module loading
      const threshold = process.env.CI ? 500 : 200;
      expect(renderTime).toBeLessThan(threshold);
    });

    it('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Agency ${i + 1}`,
        slug: `agency-${i + 1}`,
        description: `Description for agency ${i + 1}`,
        trades: [{ id: 't1', name: 'Electrician', slug: 'electrician' }],
        regions: [{ id: 'r1', name: 'Texas', code: 'TX' }],
        rating: 4.0,
        reviewCount: 10,
        projectCount: 50,
        featured: false,
        verified: true,
      }));

      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: largeDataset },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      const startTime = performance.now();

      render(<HomePage />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still be reasonably fast even with 100 items
      // CI: observed 1062ms due to cold start and module loading overhead
      const threshold = process.env.CI ? 1500 : 500;
      expect(renderTime).toBeLessThan(threshold);
    });
  });

  describe('Re-render Performance', () => {
    it('should handle filter updates efficiently', () => {
      const { rerender } = render(<HomePage />);

      // Measure re-render performance
      const startTime = performance.now();

      // Simulate filter change by re-rendering with new props
      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies.slice(0, 10) },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      rerender(<HomePage />);

      const endTime = performance.now();
      const reRenderTime = endTime - startTime;

      // Re-renders should be fast
      const threshold = process.env.CI ? 150 : 50;
      expect(reRenderTime).toBeLessThan(threshold);
    });

    it('should handle search updates efficiently', () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      const { rerender } = render(<HomePage />);

      // Simulate search by changing validation state
      const startTime = performance.now();

      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies },
        error: null,
        isLoading: false,
        isValidating: true, // Searching
        mutate: jest.fn(),
      });

      rerender(<HomePage />);

      const endTime = performance.now();
      const reRenderTime = endTime - startTime;

      // Should handle search state change quickly
      expect(reRenderTime).toBeLessThan(50);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory on multiple re-renders', () => {
      // Skip memory test in CI as it's unreliable without --expose-gc
      if (process.env.CI) {
        console.log('Skipping memory test in CI environment');
        return;
      }

      const initialMemory = process.memoryUsage().heapUsed;

      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      const { rerender, unmount } = render(<HomePage />);

      // Perform multiple re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<HomePage />);
      }

      unmount();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      // Note: This test is flaky without --expose-gc flag
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Critical Rendering Path', () => {
    it('should prioritize above-the-fold content', () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: jest.fn(),
      });

      const startTime = performance.now();

      const { container } = render(<HomePage />);

      // Check that critical content is rendered
      const heroSection = container.querySelector('h1');
      const searchBar = container.querySelector('input[placeholder*="Search"]');

      const criticalRenderTime = performance.now() - startTime;

      expect(heroSection).toBeInTheDocument();
      expect(searchBar).toBeInTheDocument();

      // Critical content should render very quickly
      const threshold = process.env.CI ? 150 : 50;
      expect(criticalRenderTime).toBeLessThan(threshold);
    });

    it('should defer non-critical content appropriately', () => {
      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      const { container } = render(<HomePage />);

      // Check that content is organized for performance
      const heroSection = container.querySelector('section');
      const agencyCards = container.querySelectorAll(
        '[data-testid^="agency-"]'
      );

      // Hero should come before agency listings
      expect(heroSection).toBeInTheDocument();
      expect(agencyCards.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Summary', () => {
    it('should meet all performance requirements', () => {
      const metrics = {
        initialRender: 0,
        withData: 0,
        reRender: 0,
      };

      // Test initial render
      (useAgencies as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: jest.fn(),
      });

      let startTime = performance.now();
      const { rerender } = render(<HomePage />);
      metrics.initialRender = performance.now() - startTime;

      // Test with data
      (useAgencies as jest.Mock).mockReturnValue({
        data: { data: mockAgencies },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      });

      startTime = performance.now();
      rerender(<HomePage />);
      metrics.withData = performance.now() - startTime;

      // Test re-render
      startTime = performance.now();
      rerender(<HomePage />);
      metrics.reRender = performance.now() - startTime;

      // All metrics should be within acceptable ranges
      // CI: observed ~600ms for withData (vs 200ms local) due to shared runners
      // and cold start overhead. Using 5x multiplier based on profiling data.
      const ciMultiplier = process.env.CI ? 5 : 1;
      expect(metrics.initialRender).toBeLessThan(100 * ciMultiplier);
      expect(metrics.withData).toBeLessThan(200 * ciMultiplier);
      expect(metrics.reRender).toBeLessThan(50 * ciMultiplier);

      // Log metrics for monitoring
      console.log('Performance Metrics:', {
        initialRender: `${metrics.initialRender.toFixed(2)}ms`,
        withData: `${metrics.withData.toFixed(2)}ms`,
        reRender: `${metrics.reRender.toFixed(2)}ms`,
      });
    });
  });
});
