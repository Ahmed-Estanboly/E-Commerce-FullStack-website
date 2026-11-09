import { useCallback, useEffect, useMemo, useState } from "react";

import { useFetch } from "../hooks/useFetch";
import { productsService } from "../lib/api/products.service";

import ProductList from "../components/products/ProductList";
import Pagination from "../components/products/Pagination";
import { Skeleton } from "../components/ui/feedback";

import type { Product, ProductCategory } from "../types/product";

const PAGE_SIZE = 9;

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
                <Skeleton className="aspect-[3/4] w-full" />
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
  // جلب كل المنتجات مرة واحدة
  const fetchProducts = useCallback(
    (signal: AbortSignal) =>
      productsService.getProducts(undefined, signal),
    []
  );

  const { data, isLoading, error } = useFetch<Product[]>(fetchProducts);

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

  // حالات الفلاتر
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // الصفحة الحالية
  const [currentPage, setCurrentPage] = useState(1);

  const products = data ?? [];
  const categories = categoriesData ?? [];

  // البحث والفلترة والترتيب
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {

      const searchValue = searchTerm.trim().toLowerCase();

const matchesSearch =
  product.title.toLowerCase().includes(searchValue) ||
  product.description.toLowerCase().includes(searchValue) ||
  product.category.name.toLowerCase().includes(searchValue);

      const matchesCategory =
        selectedCategory === "all" ||
        product.category.id.toString() === selectedCategory;

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
    products,
    searchTerm,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // عدد صفحات النتائج
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  // المنتجات التي ستظهر في الصفحة الحالية فقط
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // العودة للصفحة الأولى عند تغيير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

  // حالات التحميل والخطأ
  if (isLoading) return <ProductsPageSkeleton />;
  if (error) return <p>Error: {error}</p>;

  return (
    <main className="min-h-screen bg-canvas px-5 py-10 font-sans text-ink sm:px-8 lg:px-10 page-enter">
  
      {/* Page Introduction */}
      <section className="mb-10 border-b border-line pb-8">
        
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow-strong mb-3">
              The full catalogue
            </p>
  
            <h1 className="font-display text-5xl tracking-tight sm:text-6xl lg:text-7xl">
              The full <span className="italic text-accent">edit.</span>
            </h1>
  
            <p className="eyebrow mt-4">
              {products.length} Pieces — {categories.length} Departments
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
                  checked={selectedCategory === "all"}
                  onChange={() => setSelectedCategory("all")}
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
                    checked={selectedCategory === category.id.toString()}
                    onChange={() =>
                      setSelectedCategory(
                        selectedCategory === category.id.toString()
                          ? "all"
                          : category.id.toString()
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
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("all");
            setMinPrice("");
            setMaxPrice("");
            setSortBy("default");
          }}
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
            Showing {filteredProducts.length} of {products.length} pieces
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
          <p className="mb-4 text-xs text-muted">
            Loading categories...
          </p>
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </section>
  </main>
);

}

export default ProductsPage;