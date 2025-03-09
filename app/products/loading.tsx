import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <Skeleton className="h-8 w-32 mb-6" />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Skeleton for sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="lg:hidden">
            <Skeleton className="h-10 w-[210px]" />
            <Skeleton className="h-px w-full my-4" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <div className="space-y-2 pl-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <Skeleton className="h-12 w-full rounded-md" />
              <div className="space-y-4 pl-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Skeleton for product grid */}
        <div className="lg:col-span-3">
          <div className="hidden items-center justify-between mb-6 lg:flex">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-[210px]" />
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="aspect-square w-full">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
} 