import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAgenciesLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Skeleton className="h-8 w-48" data-testid="title-skeleton" />
        <div className="flex gap-2">
          <Skeleton
            className="h-10 w-32"
            data-testid="import-button-skeleton"
          />
          <Skeleton
            className="h-10 w-36"
            data-testid="create-button-skeleton"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="border-b bg-muted/50 p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" data-testid="search-skeleton" />
            <Skeleton className="h-10 w-32" data-testid="filter-skeleton-1" />
            <Skeleton className="h-10 w-32" data-testid="filter-skeleton-2" />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="h-12 px-4 text-left">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="h-12 px-4 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="h-12 px-4 text-left">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="h-12 px-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="h-12 px-4 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-b" data-testid="row-skeleton">
                <td className="p-4">
                  <Skeleton className="h-5 w-40" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-32" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="p-4">
                  <Skeleton className="h-5 w-12" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t p-4 flex items-center justify-between">
          <Skeleton className="h-5 w-40" data-testid="count-skeleton" />
          <div className="flex gap-2">
            <Skeleton
              className="h-10 w-10"
              data-testid="prev-button-skeleton"
            />
            <Skeleton
              className="h-10 w-10"
              data-testid="next-button-skeleton"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
