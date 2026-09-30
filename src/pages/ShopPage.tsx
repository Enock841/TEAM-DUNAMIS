import { useMemo, useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { useAppData } from '../context/appData'
import type { Product } from '../data/catalog'

type ShopPageProps = {
  onAdd: (product: Product) => void
}

export function ShopPage({ onAdd }: ShopPageProps) {
  const { products, catalogLoading, catalogError } = useAppData()
  const normalize = (value: string) => value.trim().toLowerCase()
  const categories = useMemo(
    () => {
      const seen = new Map<string, string>()
      for (const product of products) {
        const key = normalize(product.category)
        if (!seen.has(key)) seen.set(key, product.category.trim())
      }
      return ['All', ...seen.values()]
    },
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

      if (category === 'All') return products
      const targetCategory = normalize(category)
      return products.filter((product) => {
        const productCategory = normalize(product.category)
        if (targetCategory === 'extensions') return productCategory.includes('extension')
        return productCategory === targetCategory
      })
    },
    [category, products, searchTerm],
  )

  return (
    <main className="bg-[#fffaf8]">
      <section className="border-b border-[#edd4df] bg-[#f7e4ec] px-6 py-16 text-center sm:px-10 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d92c83]">
          Shop
        </p>
        <h1 className="mt-4 font-serif text-5xl text-[#3e2530] sm:text-6xl">
          Luxury hair care
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#745f68] sm:text-lg">
          Shop wigs, bundles and hair-care products selected for quality,
          everyday use and long-lasting results.
        </p>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {searchTerm && (
            <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#f7e4ec] px-5 py-4 text-center sm:flex-row sm:text-left">
              <p className="text-sm text-[#604c55]">
                Showing the closest product match for your search.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs font-bold uppercase tracking-[0.14em] text-[#d92c83]"
              >
                View all products
              </button>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item)
                  setSearchTerm('')
                }}
                className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.13em] transition ${
                  normalize(category) === normalize(item)
                    ? 'bg-[#dc2d83] text-white'
                    : 'border border-[#e4bdce] bg-white text-[#624956] hover:border-[#dc2d83]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-2.5 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {catalogLoading ? (
              <p className="col-span-2 sm:col-span-2 lg:col-span-3">Loading products...</p>
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