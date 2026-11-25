
import { useEffect, useState } from "react";
import type { Product } from "../../types/product";
import { Link, useNavigate } from "react-router-dom";
import {formatPrice } from "../../lib/utils"
import { SmartImage } from "../ui/smart-image";
import { getStoredSession } from "../../lib/auth";
import { wishlistService } from "../../lib/api/wishlist.service";
import { getWishlistIds, peekWishlistIds, wishlistCacheAdd, wishlistCacheRemove } from "../../lib/wishlist";
import { cn } from "../../lib/utils";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(() => peekWishlistIds().has(product.id));
  const [wishBusy, setWishBusy] = useState(false);
  const canWishlist = Boolean(getStoredSession()?.user);

  useEffect(() => {
    if (!canWishlist) return;
    let cancelled = false;
    void getWishlistIds().then((ids) => {
      if (!cancelled) setWishlisted(ids.has(product.id));
    });
    return () => { cancelled = true; };
  }, [canWishlist, product.id]);

  const toggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canWishlist) {
      navigate("/login");
      return;
    }
    setWishBusy(true);
    try {
      if (wishlisted) {
        await wishlistService.remove(product.id);
        wishlistCacheRemove(product.id);
        setWishlisted(false);
      } else {
        await wishlistService.add(product.id);
        wishlistCacheAdd(product.id);
        setWishlisted(true);
      }
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <Link to={`/products/${product.id}`}>
    <article className="group relative">
      {/* Product Image */}
      <div className="product-media aspect-[3/4] overflow-hidden bg-canvas-alt">
        <SmartImage
          src={product.images?.[0]}
          alt={product.title}
          presentation="general"
          fallbackLabel={product.category.name}
          aspect="none"
          primary
          fit="cover"
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={(event) => void toggleWishlist(event)}
          disabled={wishBusy}
          aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
          aria-pressed={wishlisted}
          className={cn(
            "absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center border backdrop-blur-sm transition-colors disabled:opacity-40 sm:right-3 sm:top-3 sm:h-9 sm:w-9",
            wishlisted
              ? "border-accent bg-accent text-accent-ink"
              : "border-line bg-surface/80 text-ink-soft hover:border-accent hover:text-accent",
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 20.5C7 16.5 3 13.3 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 4-4 7.2-9 11.2Z" />
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="mt-2 space-y-0.5 sm:mt-3 sm:space-y-1">
        <p className="font-mono text-[9px] uppercase tracking-wider text-muted sm:text-[10px]">
          {product.category.name}
        </p>

        <h3 className="text-sm font-medium text-ink sm:text-base">
          {product.title}
        </h3>

        <p className="shrink-0 pt-0.5 text-[12px] tabular text-ink sm:text-[13px]">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
    </Link>
  );
}

export default ProductCard;
