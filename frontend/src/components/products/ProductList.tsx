import type { Product } from "../../types/product";
import ProductCard from "./ProductCard";

interface ProductListProps {
  products: Product[];
}

function ProductList({ products }: ProductListProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}

export default ProductList;