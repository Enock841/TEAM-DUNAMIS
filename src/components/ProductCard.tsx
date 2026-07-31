import { productImage, type Product } from '../data/catalog'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
  compact?: boolean
}

export function ProductCard({
  product,
  onAdd,
  compact = false,
}: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col border-b border-[#cdb8c1] bg-[#fffdfd]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ead6df]">
        <img
          src={productImage(product)}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />
        {!product.inStock && (
          <span
            className={`absolute bg-[#fffdfd]/95 font-bold uppercase tracking-[0.16em] text-[#1d171a] ${
              compact
                ? 'left-2 top-2 px-2 py-1 text-[8px]'
                : 'left-3 top-3 px-3 py-1.5 text-[9px]'
            }`}
          >
            Out of stock
          </span>
        )}
      </div>
      <div
        className={`flex flex-1 flex-col px-1 ${compact ? 'py-3' : 'py-4'}`}
      >
        <p
          className={`font-bold uppercase tracking-[0.18em] text-[#984667] ${
            compact ? 'text-[8px]' : 'text-[9px]'
          }`}
        >
          {product.category}
        </p>
        <h3
          className={`mt-1.5 font-serif font-medium uppercase leading-[1.05] tracking-[0.01em] text-[#1d171a] ${
            compact ? 'text-lg sm:text-xl' : 'text-[23px]'
          }`}
        >
          {product.name}
        </h3>
        <p
          className={`mt-2 line-clamp-2 text-[#6b5a62] ${
            compact ? 'text-[10px] leading-4' : 'text-xs leading-5'
          }`}
        >
          {product.description}
        </p>
        <div
          className={`mt-auto flex items-center justify-between border-t border-[#e0d1d7] pt-3 ${
            compact ? 'gap-2' : 'gap-4'
          }`}
        >
          <p
            className={`font-bold text-[#1d171a] ${
              compact ? 'text-[10px]' : 'text-xs'
            }`}
          >
            GH₵{product.price.toLocaleString()}
          </p>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={!product.inStock}
            className={`inline-flex min-h-9 items-center border-b border-[#1d171a] font-bold uppercase tracking-[0.14em] text-[#1d171a] transition hover:text-[#984667] disabled:cursor-not-allowed disabled:opacity-40 ${
              compact ? 'text-[8px]' : 'text-[9px]'
            }`}
          >
            {product.inStock ? 'Add to bag' : 'Unavailable'}
          </button>
        </div>
      </div>
    </article>
  )
}
