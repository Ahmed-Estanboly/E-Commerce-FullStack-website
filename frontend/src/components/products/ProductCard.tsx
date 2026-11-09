
import type { Product } from "../../types/product";
import { Link } from "react-router-dom";
import {formatPrice } from "../../lib/utils"

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/products/${product.id}`}>
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
       
       
        <p className="shrink-0 pt-0.5 text-[13px] tabular text-ink">
              {formatPrice(product.price)}
            </p>


      </div>
    </article>
    </Link>
  );
}

export default ProductCard;