import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useAppData } from '../context/appData'
import { formatDuration } from '../data/catalog'

const categoryOrder = ['Braiding', 'Piercings', 'Lashes & Brows', 'Wigs']

function normalizeCategoryName(name: string) {
  return name.toLowerCase().replace(/\band\b/g, '&').replace(/\s+/g, ' ').trim()
}

function categoryRank(name: string) {
  const normalizedName = normalizeCategoryName(name)
  const exactRank = categoryOrder.findIndex(
    (category) => normalizeCategoryName(category) === normalizedName,
  )
  if (exactRank >= 0) return exactRank
  if (normalizedName.includes('braid')) return 0
  if (normalizedName.includes('pierc')) return 1
  if (normalizedName.includes('lash') || normalizedName.includes('brow')) return 2
  if (normalizedName.includes('wig')) return 3
  return categoryOrder.length
}

function categoryLabel(name: string) {
  const rank = categoryRank(name)
  return rank < categoryOrder.length ? categoryOrder[rank] : name
}

function categorySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function ServicesPage() {
  const { services, catalogLoading, catalogError } = useAppData()
  const routeParams = new URLSearchParams(window.location.hash.split('?')[1])
  const searchTerm = routeParams.get('search') ?? ''
  const selectedSection = routeParams.get('section')?.toLowerCase() ?? ''
  const normalizedSearch = searchTerm.toLowerCase()
  const visibleServices = useMemo(
    () =>
      normalizedSearch
        ? services.filter((service) =>
            `${service.id} ${service.name} ${service.category.name} ${service.description}`
              .toLowerCase()
              .includes(normalizedSearch),
          )
        : services,
    [normalizedSearch, services],
  )
  const visibleCategories = useMemo(
    () =>
      Array.from(
        new Map(
          visibleServices.map((service) => [
            service.category.name,
            {
              ...service.category,
              imageUrl: service.category.imageUrl || service.images[0] || '',
            },
          ]),
        ).values(),
      ).sort((first, second) => {
        const rankDifference = categoryRank(first.name) - categoryRank(second.name)
        return rankDifference || first.name.localeCompare(second.name)
      }),
    [visibleServices],
  )
  const [activeCategoryName, setActiveCategoryName] = useState(selectedSection)
  const activeCategory =
    visibleCategories.find((category) => category.name === activeCategoryName) ??
    visibleCategories[0]
  const activeServices = activeCategory
    ? visibleServices.filter(
        (service) => service.category.name === activeCategory.name,
      )
    : []
  useEffect(() => {
    if (catalogLoading || visibleCategories.length === 0) return

    const requestedCategory = visibleCategories.find((category) => {
      const normalizedName = category.name.toLowerCase()
      return (
        normalizedName === selectedSection ||
        categorySlug(category.name) === selectedSection
      )
    })
    const currentCategoryIsVisible = visibleCategories.some(
      (category) => category.name === activeCategoryName,
    )

    if (requestedCategory) {
      setActiveCategoryName(requestedCategory.name)
    } else if (!currentCategoryIsVisible) {
      setActiveCategoryName(visibleCategories[0].name)
    }
  }, [
    activeCategoryName,
    catalogLoading,
    selectedSection,
    visibleCategories,
  ])

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    categoryIndex: number,
  ) {
    let nextIndex: number
    if (event.key === 'ArrowRight') {
      nextIndex = (categoryIndex + 1) % visibleCategories.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex =
        (categoryIndex - 1 + visibleCategories.length) %
        visibleCategories.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = visibleCategories.length - 1
    } else {
      return
    }

    event.preventDefault()
    const nextCategory = visibleCategories[nextIndex]
    setActiveCategoryName(nextCategory.name)
    window.requestAnimationFrame(() => {
      document
        .getElementById(`service-tab-${categorySlug(nextCategory.name)}`)
        ?.focus()
    })
  }

  return (
    <main className="bg-[#fffdfd]">
      <section className="campaign-grid border-b border-[#bfaab3] bg-[#c992aa] px-6 py-14 text-center sm:px-10 sm:py-18">
        <p className="editorial-kicker text-[#4b313d]">Services</p>
        <h1 className="text-on-blush mt-3 font-serif text-[clamp(4.5rem,10vw,8rem)] font-light uppercase leading-[0.82]">
          Salon services
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#55434b] sm:text-lg">
          Explore braiding, piercings, lashes and brows, and wigs. We confirm
          the details and final price before your appointment.
        </p>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1480px]">
          {catalogLoading && <p>Loading salon services…</p>}
          {catalogError && <p className="text-[#8b435f]">{catalogError}</p>}
          {normalizedSearch && (
            <div className="mb-12 flex flex-col items-center justify-between gap-4 bg-[#ead2dd] px-5 py-4 text-center sm:flex-row sm:text-left">
              <p className="text-sm text-[#5f5157]">
                Showing the closest salon service match for your search.
              </p>
              <a
                href="#/services"
                className="text-xs font-bold uppercase tracking-[0.14em] text-[#984667]"
              >
                View all services
              </a>
            </div>
          )}

          {!catalogLoading && visibleCategories.length > 0 && (
            <div
              role="tablist"
              aria-label="Service categories"
              className="mb-12 flex flex-wrap justify-center gap-0 border-y border-[#cdb8c1] sm:mb-16"
            >
              {visibleCategories.map((category, categoryIndex) => {
                const isActive = category.name === activeCategory?.name
                const slug = categorySlug(category.name)
                return (
                  <button
                    id={`service-tab-${slug}`}
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`service-panel-${slug}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveCategoryName(category.name)}
                    onKeyDown={(event) =>
                      handleTabKeyDown(event, categoryIndex)
                    }
                    className={`border-x border-[#cdb8c1] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.13em] transition ${
                      isActive
                        ? 'bg-[#984667] text-white'
                        : 'bg-white text-[#624956] hover:border-[#984667]'
                    }`}
                  >
                    {categoryLabel(category.name)}
                  </button>
                )
              })}
            </div>
          )}

          {activeCategory && (
            <div
              id={`service-panel-${categorySlug(activeCategory.name)}`}
              role="tabpanel"
              aria-labelledby={`service-tab-${categorySlug(activeCategory.name)}`}
              className="grid gap-8 lg:grid-cols-[0.8fr_2fr] lg:gap-16"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#984667]">
                  Service category
                </p>
                <h2 className="mt-3 font-serif text-4xl uppercase text-[#342b2f] sm:text-5xl">
                  {categoryLabel(activeCategory.name)}
                </h2>
                <img
                  src={activeCategory.imageUrl}
                  alt=""
                  className="mt-6 aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
                />
              </div>
              <div className="divide-y divide-[#ecd6df]">
                {activeServices.map((service) => (
                  <article
                    key={service.id}
                    className="grid gap-5 py-7 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-start"
                  >
                    <div>
                      <h3 className="font-serif text-2xl text-[#342b2f]">
                        {service.name}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5157]">
                        {service.description}
                      </p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#9a7183]">
                        {formatDuration(service.durationMinutes)} · Up to{' '}
                        {service.category.dailyCap} bookings per day
                      </p>
                    </div>
                    <div className="flex items-center gap-5 sm:flex-col sm:items-end">
                      <p className="font-serif text-xl text-[#342b2f]">
                        GH₵{service.priceMin.toLocaleString()}–
                        {service.priceMax.toLocaleString()}
                      </p>
                      <a
                        href={`#/appointments?service=${service.id}`}
                        className="bg-[#984667] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-white"
                      >
                        Book
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
