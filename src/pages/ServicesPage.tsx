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
    <main className="bg-[#fffaf8]">
      <section className="relative isolate grid min-h-[680px] overflow-hidden lg:min-h-[620px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] xl:grid-cols-[0.9fr_1.1fr]">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center lg:hidden"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(62,33,48,0.9)_0%,rgba(62,33,48,0.77)_55%,rgba(62,33,48,0.58)_100%)] lg:hidden" />
        <div className="flex items-center px-6 py-20 text-white sm:px-10 sm:py-24 lg:bg-[#4b2637] lg:px-10 lg:py-16 xl:px-16 2xl:px-24">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f2a7c9]">
              Salon menu
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-tight sm:text-6xl lg:text-[60px] xl:text-7xl">
              Beauty services, tailored to you.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/75 sm:text-lg">
              Choose from braiding, makeup, nails and lashes. We confirm the
              details and final price with you before your appointment.
            </p>
            <a
              href="#/appointments"
              className="mt-9 inline-flex rounded-full bg-[#dc2d83] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white"
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
          {catalogLoading && <p>Loading salon servicesâ€¦</p>}
          {catalogError && <p className="text-[#8b435f]">{catalogError}</p>}
          {normalizedSearch && (
            <div className="mb-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#f7e4ec] px-5 py-4 text-center sm:flex-row sm:text-left">
              <p className="text-sm text-[#604c55]">
                Showing the closest salon service match for your search.
              </p>
              <a
                href="#/services"
                className="text-xs font-bold uppercase tracking-[0.14em] text-[#d92c83]"
              >
                View all services
              </a>
            </div>
          )}

          {!catalogLoading && visibleCategories.length > 0 && (
            <div className="mb-16 grid gap-5 sm:grid-cols-2 lg:mb-24 lg:grid-cols-4">
              {visibleCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#/services?section=${category.name.toLowerCase()}`}
                  className="group relative min-h-[340px] overflow-hidden rounded-[1.75rem] bg-[#4b2637] sm:min-h-[390px] lg:min-h-[440px]"
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
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d92c83]">
                    {String(categoryIndex + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-3 font-serif text-4xl text-[#3e2530] sm:text-5xl">
                    {category.name}
                  </h2>
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="mt-6 aspect-[4/3] w-full rounded-2xl object-cover lg:aspect-[4/5]"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {visibleServices
                    .filter(
                      (service) => service.category.name === category.name,
                    )
                    .map((service) => (
                      <a
                        key={service.id}
                        href={`#/appointments?service=${service.id}`}
                        className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_6px_24px_rgba(87,43,61,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(87,43,61,0.14)]"
                      >
                        <div className="aspect-[4/5] w-full overflow-hidden">
                          {service.images[0] && (
                            <img
                              src={service.images[0]}
                              alt={service.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between gap-2 p-4">
                          <div>
                            <h3 className="block font-serif text-lg text-[#3e2530]">
                              {service.name}
                            </h3>
                            <p className="mt-1 text-xs text-[#8f707d]">
                              {formatDuration(service.durationMinutes)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#b32269]">
                            GHC {service.priceMin.toLocaleString()}-{service.priceMax.toLocaleString()}
                          </span>
                        </div>
                      </a>
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
