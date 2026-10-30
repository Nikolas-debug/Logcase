import { Suspense } from "react";
import { Catalog, CatalogSkeleton, StoreFooter, StoreHeader } from "@/components/catalog";
import { Hero } from "@/components/hero";

export default function CatalogPage() {
  // searchParams are read client-side (useSearchParams) so everything above the grid stays static under cacheComponents.
  return (
    <>
      <StoreHeader />
      <Hero />
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog />
      </Suspense>
      <StoreFooter />
    </>
  );
}
