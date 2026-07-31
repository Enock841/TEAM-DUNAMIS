import { productImage, type Product } from '../data/catalog'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col border-b border-[#cdb8c1] bg-[#fffdfd]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ead6df]">
        <img
          src={productImage(product)}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        />
        {!product.inStock && (
          <span className="absolute left-3 top-3 bg-[#fffdfd]/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#1d171a]">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 py-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#984667]">
          {product.category}
        </p>
        <h3 className="mt-1.5 font-serif text-[23px] font-medium uppercase leading-[1.05] tracking-[0.01em] text-[#1d171a]">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6b5a62]">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#e0d1d7] pt-3">
          <p className="text-xs font-bold text-[#1d171a]">
            GH₵{product.price.toLocaleString()}
          </p>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={!product.inStock}
            className="border-b border-[#1d171a] pb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#1d171a] transition hover:text-[#984667] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {product.inStock ? 'Add to bag' : 'Unavailable'}
          </button>
        </div>
      </div>
    </article>
  )
}
