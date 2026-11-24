import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useFetch } from "../hooks/useFetch";
import { useBranchCatalog } from "../hooks/use-branch-catalog";
import { useBranchSelection } from "../store/branch-context";
import { productsService } from "../lib/api/products.service";

import ProductList from "../components/products/ProductList";
import Pagination from "../components/products/Pagination";
import { Skeleton } from "../components/ui/feedback";

import type { Product, ProductCategory, ProductSort } from "../types/product";

const PAGE_SIZE = 9;

const SORT_PARAM: Record<string, ProductSort> = {
  default: "newest",
  "price-low": "price_asc",
  "price-high": "price_desc",
  name: "name",
};

interface CatalogPage {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  /** True when the backend returned the full filtered set (department views paginate locally). */
  clientSide: boolean;
}

/**
 * Homepage department slugs → catalogue categories.
 *
 * Departments are editorial groupings; the backend only knows flat
 * categories. Each department lists the category names it draws from, plus
 * optional title keywords used to narrow shared categories (e.g. perfume
 * inside Miscellaneous for Beauty & Care).
 */
const DEPARTMENT_SLUGS = new Set([
  "fashion",
  "pantry-fresh",
  "audio-tech",
  "furniture-home",
  "beauty-care",
  "objects-gifts",
]);

const DEPARTMENT_NAMES: Record<string, string> = {
  fashion: "Fashion & Footwear",
  "pantry-fresh": "Pantry & Fresh",
  "audio-tech": "Audio & Tech",
  "furniture-home": "Furniture & Home",
  "beauty-care": "Beauty & Care",
  "objects-gifts": "Objects & Gifts",
};

const DEPARTMENT_FILTERS: Record<string, { categories: string[]; keywords?: string[] }> = {
  fashion: { categories: ["Clothes", "Shoes"] },
  "pantry-fresh": {
    categories: ["Miscellaneous"],
    keywords: ["food", "pantry", "grocery", "kitchen", "culinary", "fresh", "produce"],
  },
  "audio-tech": { categories: ["Electronics"] },
  "furniture-home": { categories: ["Furniture"] },
  "beauty-care": {
    categories: ["Miscellaneous"],
    keywords: ["beauty", "care", "parfum", "perfume", "fragrance", "cosmetic"],
  },
  "objects-gifts": {
    categories: ["Miscellaneous"],
    keywords: ["object", "gift", "tumbler", "luggage", "handbag", "sunglass", "bicycle", "kart", "decor", "ceramic", "candle"],
  },
};

function matchesDepartment(product: Product, slug: string): boolean {
  const filter = DEPARTMENT_FILTERS[slug];
  if (!filter) return false;
  const categoryName = product.category?.name ?? "";
  if (!filter.categories.some((name) => name.toLowerCase() === categoryName.toLowerCase())) {
    return false;
  }
  if (!filter.keywords?.length) return true;
  const value = `${product.title} ${categoryName}`.toLowerCase();
  return filter.keywords.some((keyword) => value.includes(keyword));
}

function ProductsPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-canvas px-5 py-10 sm:px-8 lg:px-10"
      aria-label="Loading products"
    >
      <section className="mb-10 border-b border-line pb-8">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-5 h-16 w-72 max-w-full" />
        <Skeleton className="mt-4 h-3 w-48" />
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-[190px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden border-r border-line pr-6 md:block">
          <Skeleton className="h-3 w-24" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-28" />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex justify-between border-b border-line pb-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-48" />
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-3/4 w-full" />
                <Skeleton className="mt-4 h-2.5 w-20" />
                <Skeleton className="mt-3 h-4 w-4/5" />
                <Skeleton className="mt-3 h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get("category") ?? "all";
  const searchParam = searchParams.get("q") ?? "";
  const departmentParam =
    categoryParam !== "all" && DEPARTMENT_SLUGS.has(categoryParam) ? categoryParam : null;

  const isDepartmentView = Boolean(departmentParam);
  const { selectedBranchId } = useBranchSelection();
  const { data: branchCatalog } = useBranchCatalog(selectedBranchId);

  // حالات الفلاتر المحلية
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // الصفحة الحالية
  const [currentPage, setCurrentPage] = useState(1);

  // جلب الفئات
  const fetchCategories = useCallback(
    () => productsService.getCategories(),
    []
  );

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useFetch<ProductCategory[]>(fetchCategories);

  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  // معاملات الفئة في الرابط: id رقمي أو slug أو slug القسم (department)
  const urlCategoryId = useMemo(() => {
    if (!categoryParam || categoryParam === "all" || departmentParam) return null;
    const byId = categories.find((c) => c.id.toString() === categoryParam);
    if (byId) return byId.id.toString();
    const bySlug = categories.find((c) => c.slug === categoryParam);
    return bySlug ? bySlug.id.toString() : categoryParam;
  }, [categoryParam, departmentParam, categories]);

  const effectiveSelectedCategory = departmentParam ?? urlCategoryId ?? "all";
  const numericCategoryId = useMemo(() => {
    const value = Number(urlCategoryId);
    return urlCategoryId && Number.isInteger(value) && value > 0 ? value : undefined;
  }, [urlCategoryId]);

  // مزامنة حقل البحث مع معامل ?q والعودة للصفحة الأولى عند تغيّر الفلاتر
  const urlKey = `${searchParam}|${categoryParam}`;
  const [appliedUrlKey, setAppliedUrlKey] = useState(urlKey);
  if (appliedUrlKey !== urlKey) {
    setAppliedUrlKey(urlKey);
    setSearchTerm(searchParam);
    setCurrentPage(1);
  }

  const filterKey = `${searchTerm}|${effectiveSelectedCategory}|${minPrice}|${maxPrice}|${sortBy}`;
  const [appliedFilterKey, setAppliedFilterKey] = useState(filterKey);
  if (appliedFilterKey !== filterKey) {
    setAppliedFilterKey(filterKey);
    setCurrentPage(1);
  }

  // بحث مؤجل — يرسل الاستعلام للخادم بعد توقف قصير عن الكتابة
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // منتجات القسم (department) تُفلتر محلياً بالكلمات المفتاحية؛
  // باقي العرض يفلتر ويُرتّب ويُصفّح على الخادم.
  const catalogRequest = useCallback(
    async (signal: AbortSignal): Promise<CatalogPage> => {
      const base = { branchId: selectedBranchId };
      if (isDepartmentView) {
        const result = await productsService.queryProducts(base, signal);
        const items = Array.isArray(result) ? result : result.items;
        return { items, total: items.length, page: 1, totalPages: 1, clientSide: true };
      }
      const result = await productsService.queryProducts(
        {
          ...base,
          q: debouncedSearch || undefined,
          categoryIds: numericCategoryId ? [numericCategoryId] : undefined,
          minPrice: minPrice === "" ? undefined : Number(minPrice),
          maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
          sort: SORT_PARAM[sortBy] ?? "newest",
          page: currentPage,
          limit: PAGE_SIZE,
        },
        signal,
      );
      if (Array.isArray(result)) {
        return { items: result, total: result.length, page: 1, totalPages: 1, clientSide: true };
      }
      return { ...result, clientSide: false };
    },
    [isDepartmentView, selectedBranchId, debouncedSearch, numericCategoryId, minPrice, maxPrice, sortBy, currentPage],
  );

  const { data: catalog, isLoading, error } = useFetch<CatalogPage>(catalogRequest);

  const catalogItems = useMemo(() => catalog?.items ?? [], [catalog]);
  const productsTotal = catalog
    ? catalog.clientSide
      ? catalogItems.length
      : catalog.total
    : 0;

  // دمج مخزون الفرع المحدد مع منتجات الصفحة الحالية
  const branchProducts = useMemo(() => {
    const assignedItems = new Map(
      (branchCatalog ?? []).map((item) => [item.productId, item]),
    );
    return catalogItems.map((product) => {
      const inventory = assignedItems.get(product.id);
      return inventory ? { ...product, stock: inventory.quantity } : product;
    });
  }, [branchCatalog, catalogItems]);

  const goToCategory = (categoryId: string | null) => {
    const params = new URLSearchParams();
    if (searchParam) params.set("q", searchParam);
    if (categoryId) params.set("category", categoryId);
    const query = params.toString();
    navigate(query ? `/shop?${query}` : "/shop", { replace: true });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    setSearchParams({}, { replace: true });
  };

  // البحث والفلترة والترتيب — للعرض المحلي فقط (أقسام department)؛
  // العرض العادي يفلتر على الخادم مسبقاً.
  const clientSide = catalog?.clientSide ?? true;
  const filteredProducts = useMemo(() => {
    if (!clientSide) return branchProducts;

    const result = branchProducts.filter((product) => {
      const searchValue = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        product.title.toLowerCase().includes(searchValue) ||
        product.description.toLowerCase().includes(searchValue) ||
        (product.category?.name ?? "").toLowerCase().includes(searchValue);

      let matchesCategory = effectiveSelectedCategory === "all" || effectiveSelectedCategory === "";

      if (!matchesCategory && DEPARTMENT_SLUGS.has(effectiveSelectedCategory)) {
        matchesCategory = matchesDepartment(product, effectiveSelectedCategory);
      } else if (!matchesCategory) {
        matchesCategory = product.category?.id?.toString() === effectiveSelectedCategory;
      }

      const matchesMinPrice =
        minPrice === "" || product.price >= Number(minPrice);

      const matchesMaxPrice =
        maxPrice === "" || product.price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [
    branchProducts,
    clientSide,
    searchTerm,
    effectiveSelectedCategory,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // عدد صفحات النتائج: محلي لأقسام department، من الخادم لباقي العرض
  const totalPages = clientSide
    ? Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
    : Math.max(1, catalog?.totalPages ?? 1);
  const effectivePage = clientSide
    ? Math.min(currentPage, totalPages)
    : currentPage;

  // المنتجات التي ستظهر في الصفحة الحالية فقط
  const currentProducts = useMemo(() => {
    if (!clientSide) return filteredProducts;
    const startIndex = (effectivePage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, effectivePage, clientSide]);

  // حالات التحميل والخطأ — لا نمسح النتائج أثناء إعادة الجلب (تصفّح الصفحات)
  if (isLoading && !catalog) return <ProductsPageSkeleton />;
  if (error && !catalog) return <p>Error: {error}</p>;

  const activeDepartment = departmentParam ? DEPARTMENT_NAMES[departmentParam] : null;

  return (
    <main className="min-h-screen bg-canvas px-5 py-10 font-sans text-ink sm:px-8 lg:px-10 page-enter">
  
      {/* Page Introduction */}
      <section className="mb-10 border-b border-line pb-8">
        
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow-strong mb-3">
              {activeDepartment ?? 'The full catalogue'}
            </p>
  
            <h1 className="font-display text-5xl tracking-tight sm:text-6xl lg:text-7xl">
              {activeDepartment ? (
                <>{activeDepartment} <span className="italic text-accent">edit.</span></>
              ) : (
                <>The full <span className="italic text-accent">edit.</span></>
              )}
            </h1>
  
            <p className="eyebrow mt-4">
              {clientSide ? filteredProducts.length : productsTotal} Pieces — {categories.length} Departments
            </p>
          </div>
  
          <p className="max-w-sm text-xs leading-6 text-ink-soft">
            Discover our complete collection. Explore products,
            browse categories and find your next favourite piece.
          </p>
        </div>
      </section>
  
      {/* Products Layout */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[190px_minmax(0,1fr)] lg:gap-12">
  
        {/* Sidebar */}
        <aside className="border-b border-line pb-8 md:border-b-0 md:border-r md:pr-6">
  
          {/* Categories */}
          <div className="border-b border-line pb-6">
            <h2 className="eyebrow-strong mb-5">
              Department
            </h2>
  
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={effectiveSelectedCategory === "all"}
                  onChange={() => goToCategory(null)}
                  className="accent-accent"
                />
                All pieces
              </label>
  
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex min-w-0 cursor-pointer items-center gap-2 text-xs text-ink-soft"
                >
                  <input
                    type="checkbox"
                    checked={effectiveSelectedCategory === category.id.toString()}
                    onChange={() =>
                      goToCategory(
                        effectiveSelectedCategory === category.id.toString()
                          ? null
                          : category.id.toString(),
                      )
                    }
                    className="accent-accent"
                  />
                  <span className="min-w-0 truncate" title={category.name}>
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
  
          {/* Price */}
          <div className="border-b border-line py-6">
            <h2 className="eyebrow-strong mb-5">
              Price
            </h2>
  
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={minPrice === "" && maxPrice === "100"}
                  onChange={() => {
                    setMinPrice(minPrice === "" && maxPrice === "100" ? "" : "");
                    setMaxPrice(maxPrice === "100" ? "" : "100");
                  }}
                  className="accent-accent"
                />
                Under 100
              </label>
  
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={minPrice === "100" && maxPrice === "300"}
                  onChange={() => {
                    setMinPrice(minPrice === "100" && maxPrice === "300" ? "" : "100");
                    setMaxPrice(minPrice === "100" && maxPrice === "300" ? "" : "300");
                  }}
                  className="accent-accent"
                />
                100 – 300
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={minPrice === "300" && maxPrice === ""}
                onChange={() => {
                  setMinPrice(minPrice === "300" ? "" : "300");
                  setMaxPrice("");
                }}
                className="accent-accent"
              />
              300 and above
            </label>
          </div>
        </div>
  
        {/* Reset Filters */}
        <button
          type="button"
          onClick={resetFilters}
          className="mt-6 text-[10px] uppercase tracking-[0.2em] text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Reset all filters
        </button>
      </aside>
  
      {/* Products Area */}
      <div className="min-w-0">
  
        {/* Toolbar */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
  
          <p className="eyebrow">
            Showing {filteredProducts.length} of {productsTotal} pieces
          </p>
  
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted outline-none transition-colors focus:border-ink sm:w-48"
            />
  
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-line bg-surface px-3 py-2 text-[10px] uppercase tracking-wider text-ink outline-none transition-colors focus:border-ink"
            >
              <option value="default">Newest first</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
  
        {/* Loading Categories */}
        {isLoadingCategories && (
          <div className="mb-4 flex flex-wrap gap-2" role="status" aria-label="Loading categories">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-24" />
            ))}
          </div>
        )}
  
        {categoriesError && (
          <p className="mb-4 text-xs text-danger">
            Failed to load categories.
          </p>
        )}
  
        {/* Product Grid */}
        {currentProducts.length > 0 ? (
          <ProductList products={currentProducts} />
        ) : (
          <p className="py-20 text-center text-sm text-muted">
            No products found.
          </p>
        )}
  
        {/* Pagination */}
        <div className="mt-10 border-t border-line pt-6">
          <Pagination
            currentPage={effectivePage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 200, behavior: "smooth" });
            }}
          />
        </div>
      </div>
    </section>
  </main>
);

}

export default ProductsPage;
