import { useMemo, useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { useAppData } from '../context/appData'
import type { Product } from '../data/catalog'

type ShopPageProps = {
  onAdd: (product: Product) => void
}

export function ShopPage({ onAdd }: ShopPageProps) {
  const { products, catalogLoading, catalogError } = useAppData()
  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [products],
  )
  const hashCategory = new URLSearchParams(window.location.hash.split('?')[1]).get(
    'category',
  )
  const hashSearch = new URLSearchParams(window.location.hash.split('?')[1]).get(
    'search',
  )
  const [searchTerm, setSearchTerm] = useState(hashSearch ?? '')
  const [category, setCategory] = useState(hashCategory ?? 'All')

  const visibleProducts = useMemo(
    () => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase()
        return products.filter((product) =>
          `${product.id} ${product.name} ${product.category} ${product.description}`
            .toLowerCase()
            .includes(query),
        )
      }

      return category === 'All'
        ? products
        : products.filter((product) => product.category === category)
    },
    [category, products, searchTerm],
  )

  return (
    <main className="bg-[#fffdfd]">
      <section className="campaign-grid border-b border-[#bfaab3] bg-[#c992aa] px-6 py-14 text-center sm:px-10 sm:py-18">
        <p className="editorial-kicker text-[#4b313d]">
          Shop
        </p>
        <h1 className="text-on-blush mt-3 font-serif text-[clamp(4.5rem,10vw,8rem)] font-light uppercase leading-[0.82]">
          Luxury hair care
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#55434b] sm:text-lg">
          Shop wigs, bundles and hair-care products selected for quality,
          everyday use and long-lasting results.
        </p>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1480px]">
          {searchTerm && (
            <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#ead2dd] px-5 py-4 text-center sm:flex-row sm:text-left">
              <p className="text-sm text-[#5f5157]">
                Showing the closest product match for your search.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs font-bold uppercase tracking-[0.14em] text-[#984667]"
              >
                View all products
              </button>
            </div>
          )}
          <div
            role="tablist"
            aria-label="Product categories"
            className="inner-tab-nav border-y border-[#cdb8c1]"
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => {
                  setCategory(item)
                  setSearchTerm('')
                }}
                className={`border-x border-[#cdb8c1] px-4 py-3 text-[9px] font-bold uppercase tracking-[0.13em] transition sm:px-5 ${
                  category === item
                    ? 'bg-[#984667] text-white'
                    : 'border border-[#cdb8c1] bg-white text-[#624956] hover:border-[#984667]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-10 grid gap-x-2 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {catalogLoading ? (
              <p className="sm:col-span-2 lg:col-span-3">Loading products…</p>
            ) : catalogError ? (
              <p className="sm:col-span-2 lg:col-span-3 text-[#8b435f]">
                {catalogError}
              </p>
            ) : visibleProducts.length ? (
              visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={onAdd} />
              ))
            ) : (
              <p className="sm:col-span-2 lg:col-span-3">
                No products match this selection.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
