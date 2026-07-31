import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useAppData } from '../context/appData'
import { formatDuration, imageBase } from '../data/catalog'

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
  const heroImage =
    activeCategory?.imageUrl || `${imageBase}/service-lace-install.jpg`

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
      <section className="relative isolate grid min-h-[620px] overflow-hidden bg-[#c992aa] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center lg:hidden"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(62,33,48,0.78)_0%,rgba(62,33,48,0.66)_55%,rgba(62,33,48,0.5)_100%)] lg:hidden" />
        <div className="campaign-grid flex items-center px-6 py-20 text-[#fff8fb] sm:px-10 sm:py-24 lg:bg-[#c992aa] lg:px-10 lg:py-16 lg:text-[#44343b] xl:px-16 2xl:px-24">
          <div className="max-w-xl">
            <p className="editorial-kicker text-[#e5bfd0] lg:text-[#4b313d]">
              Salon menu
            </p>
            <h1 className="mt-5 font-serif text-6xl font-light uppercase leading-[0.86] sm:text-7xl xl:text-8xl">
              Beauty services, tailored to you.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#ead6df] sm:text-lg lg:text-[#55434b]">
              Explore braiding, piercings, lashes and brows, and wigs. We
              confirm the details and final price before your appointment.
            </p>
            <a
              href="#/appointments"
              className="mt-9 inline-flex border border-[#1d171a] bg-[#1d171a] px-8 py-3.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white"
            >
              Book your visit
            </a>
          </div>
        </div>
        <img
          src={heroImage}
          alt="Beauty service at Beryl's Beauty Mark"
          className="hidden h-full min-h-[420px] w-full object-cover lg:block"
        />
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24 xl:py-28">
        <div className="mx-auto max-w-7xl">
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
              className="-mx-6 mb-12 flex snap-x snap-mandatory overflow-x-auto border-y border-[#dcb9c8] px-6 sm:mx-0 sm:mb-16 sm:px-0"
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
                    className={`min-w-[72%] snap-start border-r border-[#dcb9c8] px-5 py-6 text-left transition-colors first:border-l sm:min-w-0 sm:flex-1 sm:px-6 ${
                      isActive
                        ? 'bg-[#1d171a] text-[#fff8fb]'
                        : 'bg-[#f7e4ec] text-[#44343b] hover:bg-[#efd4df]'
                    }`}
                  >
                    <span className="block text-[9px] font-bold uppercase tracking-[0.2em] opacity-65">
                      {String(categoryIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-2 block font-serif text-2xl uppercase sm:text-3xl">
                      {categoryLabel(category.name)}
                    </span>
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
