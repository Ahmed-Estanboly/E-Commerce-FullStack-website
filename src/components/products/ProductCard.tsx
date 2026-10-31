import type { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group">
      {/* Product Image */}
      <div className="product-media aspect-[3/4] overflow-hidden bg-canvas-alt">
        <img
          src={product.images[0]}
          alt={product.title}
          data-primary
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="mt-3 space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {product.category.name}
        </p>

        <h3 className="text-base font-medium text-ink">
          {product.title}
        </h3>

        <p className="text-sm text-ink-soft tabular">
          {product.price.toFixed(2)}
        </p>
      </div>
    </article>
  );
}

export default ProductCard;