import { useEffect } from 'react'
import { useAppData } from '../context/appData'
import { formatDuration, imageBase } from '../data/catalog'

const categoryOrder = ['Braiding', 'Makeup', 'Nails', 'Lashes']

export function ServicesPage() {
  const { services, catalogLoading, catalogError } = useAppData()
  const routeParams = new URLSearchParams(window.location.hash.split('?')[1])
  const searchTerm = routeParams.get('search') ?? ''
  const selectedSection = routeParams.get('section')?.toLowerCase() ?? ''
  const normalizedSearch = searchTerm.toLowerCase()
  const visibleServices = normalizedSearch
    ? services.filter((service) =>
        `${service.id} ${service.name} ${service.category.name} ${service.description}`
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : services
  const visibleCategories = Array.from(
    new Map(
      visibleServices.map((service) => [
        service.category.name,
        {
          ...service.category,
          imageUrl: service.category.imageUrl || service.images[0] || '',
        },
      ]),
    ).values(),
  ).sort(
    (first, second) =>
      categoryOrder.indexOf(first.name) - categoryOrder.indexOf(second.name),
  )
  const heroImage =
    visibleCategories[0]?.imageUrl || `${imageBase}/service-lace-install.jpg`

  useEffect(() => {
    if (!selectedSection || catalogLoading) return

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(selectedSection)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedSection, catalogLoading, visibleCategories.length])

  return (
    <main className="bg-[#fffdfd]">
      <section className="relative isolate grid min-h-[620px] overflow-hidden bg-[#c992aa] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center lg:hidden"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(62,33,48,0.9)_0%,rgba(62,33,48,0.77)_55%,rgba(62,33,48,0.58)_100%)] lg:hidden" />
        <div className="campaign-grid flex items-center px-6 py-20 text-white sm:px-10 sm:py-24 lg:bg-[#c992aa] lg:px-10 lg:py-16 lg:text-[#1d171a] xl:px-16 2xl:px-24">
          <div className="max-w-xl">
            <p className="editorial-kicker text-[#6f354f]">
              Salon menu
            </p>
            <h1 className="mt-5 font-serif text-6xl font-light uppercase leading-[0.86] sm:text-7xl xl:text-8xl">
              Beauty services, tailored to you.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/75 sm:text-lg lg:text-[#4f3e46]">
              Choose from braiding, makeup, nails and lashes. We confirm the
              details and final price with you before your appointment.
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
            <div className="mb-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#ead2dd] px-5 py-4 text-center sm:flex-row sm:text-left">
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
            <div className="mb-16 grid gap-2 sm:grid-cols-2 lg:mb-24 lg:grid-cols-4">
              {visibleCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#/services?section=${category.name.toLowerCase()}`}
                  className="group relative min-h-[340px] overflow-hidden bg-[#1d171a] sm:min-h-[390px] lg:min-h-[440px]"
                >
                  <img
                    src={category.imageUrl}
                    alt={`${category.name} service`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#29151f]/90 via-[#29151f]/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h2 className="font-serif text-3xl">{category.name}</h2>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                      View services
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {visibleCategories.map((category, categoryIndex) => (
            <div
              id={category.name.toLowerCase()}
              key={category.id}
              className={`scroll-mt-28 ${categoryIndex ? 'mt-16 border-t border-[#e8cbd8] pt-16 sm:mt-20 sm:pt-20' : ''}`}
            >
              <div className="grid gap-8 lg:grid-cols-[0.8fr_2fr] lg:gap-16">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#984667]">
                    {String(categoryIndex + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-3 font-serif text-4xl text-[#1d171a] sm:text-5xl">
                    {category.name}
                  </h2>
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="mt-6 aspect-[4/3] w-full rounded-2xl object-cover lg:aspect-[4/5]"
                  />
                </div>
                <div className="divide-y divide-[#ecd6df]">
                  {visibleServices
                    .filter(
                      (service) => service.category.name === category.name,
                    )
                    .map((service) => (
                      <article
                        key={service.id}
                        className="grid gap-5 py-7 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-start"
                      >
                        <div>
                          <h3 className="font-serif text-2xl text-[#1d171a]">
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
                          <p className="font-serif text-xl text-[#1d171a]">
                            GH₵{service.priceMin.toLocaleString()}–
                            {service.priceMax.toLocaleString()}
                          </p>
                          <a
                            href={`#/appointments?service=${service.id}`}
                            className="rounded-full bg-[#984667] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-white"
                          >
                            Book
                          </a>
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
