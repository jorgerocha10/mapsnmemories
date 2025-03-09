import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-20" />
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
        {/* Product gallery skeleton */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-background">
            <Skeleton className="h-full w-full" />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 flex-shrink-0 rounded-md" />
            ))}
          </div>
        </div>
        
        {/* Product information skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-full max-w-md mb-4" />
            
            <div className="mt-4 flex items-end gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          
          <Skeleton className="h-px w-full" />
          
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          
          <Skeleton className="h-12 w-full" />
          
          <Skeleton className="h-px w-full" />
          
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews skeleton */}
      <div className="mt-16 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
        
        <Skeleton className="h-px w-full my-6" />
        
        <div className="grid gap-8 md:grid-cols-12">
          <div className="space-y-6 md:col-span-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-8">
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Related products skeleton */}
      <div className="mt-16 space-y-6">
        <Skeleton className="h-8 w-64" />
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="aspect-square w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 