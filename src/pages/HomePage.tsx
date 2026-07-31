import { useEffect, useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { useAppData } from '../context/appData'
import type { Product } from '../data/catalog'
import { api, type HeroSlide, type ShopCategoryTile } from '../lib/api'

function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [index, setIndex] = useState(0)

  useEffect(function () {
    let cancelled = false
    api.heroSlides().then(function (data) {
      if (!cancelled) setSlides(data)
    })
    return function () {
      cancelled = true
    }
  }, [])

  useEffect(function () {
    if (slides.length < 2) return
    const timer = setInterval(function () {
      setIndex(function (current) {
        return (current + 1) % slides.length
      })
    }, 6000)
    return function () {
      clearInterval(timer)
    }
  }, [slides])

  if (slides.length === 0) return null
  const slide = slides[index]

  return (
    <section data-home-hero className="relative grid min-h-[680px] overflow-hidden bg-[#d8aabd] lg:grid-cols-[1.12fr_0.88fr]">
      <div className="absolute inset-0 overflow-hidden opacity-55 lg:relative lg:min-h-[680px] lg:opacity-100">
        {slides.map(function (item, itemIndex) {
          return (
            <img
              key={item.id}
              src={item.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition-opacity duration-1000 ease-in-out"
              style={{ opacity: itemIndex === index ? 1 : 0 }}
            />
          )
        })}
        <div className="absolute inset-0 bg-[#d8aabd]/35 lg:bg-[linear-gradient(180deg,transparent_55%,rgba(29,23,26,0.22)_100%)]" />
      </div>
      <div className="campaign-grid relative z-[1] flex min-h-[680px] items-center bg-[#d8aabd]/45 px-7 py-16 text-[#1d171a] backdrop-blur-[1px] sm:px-12 lg:min-h-0 lg:border-l lg:border-[#b7839b] lg:bg-transparent lg:px-16 lg:backdrop-blur-none xl:px-20">
        <div key={slide.id} className="max-w-xl">
          <p className="editorial-kicker text-[#6f354f]">{slide.eyebrow}</p>
          <h1 className="mt-5 font-serif text-[clamp(4.4rem,8vw,7.8rem)] font-light uppercase leading-[0.78] tracking-[-0.035em]">
            {slide.title}
          </h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-[#503f47] sm:text-base">
            {slide.subtitle}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#/shop" className="inline-flex min-h-11 items-center justify-center border border-[#1d171a] bg-[#1d171a] px-8 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#984667]">
              Shop the collection
            </a>
            <a href="#/appointments" className="inline-flex min-h-11 items-center justify-center border border-[#1d171a] px-8 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1d171a] transition hover:bg-[#fffdfd]">
              Book a visit
            </a>
          </div>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-5 z-10 flex gap-1.5">
          {slides.map(function (item, dotIndex) {
            return (
              <button
                key={item.id}
                aria-label={'Show slide ' + (dotIndex + 1)}
                onClick={function () { setIndex(dotIndex) }}
                className="h-1.5 transition-all duration-300"
                style={{
                  width: dotIndex === index ? 24 : 8,
                  backgroundColor: dotIndex === index ? '#1d171a' : 'rgba(29,23,26,0.35)',
                }}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export function HomePage(props: { onAdd: (product: Product) => void }) {
  const onAdd = props.onAdd
  const appData = useAppData()
  const products = appData.products
  const services = appData.services
  const catalogLoading = appData.catalogLoading
  const catalogError = appData.catalogError

  const [categoryTiles, setCategoryTiles] = useState<ShopCategoryTile[]>([])
  useEffect(function () {
    let cancelled = false
    api.shopCategoryTiles().then(function (data) {
      if (!cancelled) setCategoryTiles(data)
    })
    return function () {
      cancelled = true
    }
  }, [])

  const categoryMap = new Map()
  for (const service of services) {
    categoryMap.set(service.category.name, {
      id: service.category.id,
      name: service.category.name,
      imageUrl: service.category.imageUrl || service.images[0] || '',
    })
  }
  const orderList = ['Braiding', 'Makeup', 'Nails', 'Lashes']
  const serviceCategories = Array.from(categoryMap.values()).sort(function (first, second) {
    return orderList.indexOf(first.name) - orderList.indexOf(second.name)
  })

  return (
    <>
      <HeroBanner />

      <section className="bg-[#fffdfd] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="editorial-kicker text-[#984667]">Just landed</p>
              <h2 className="mt-2 font-serif text-4xl font-normal uppercase text-[#1d171a] sm:text-5xl">New arrivals</h2>
            </div>
            <a href="#/shop" className="w-fit border border-[#1d171a] px-5 py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#1d171a]">
              View all
            </a>
          </div>
          <div className="mt-8 grid gap-x-2 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {catalogLoading && <p className="sm:col-span-2 lg:col-span-3 xl:col-span-5">Loading client favourites...</p>}
            {!catalogLoading && !catalogError && products.slice(0, 5).map(function (product) {
              return <ProductCard key={product.id} product={product} onAdd={onAdd} />
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#d6a8bb] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1480px]">
          <div className="text-center">
            <p className="editorial-kicker text-[#6f354f]">Shop your mood</p>
            <h2 className="mt-3 font-serif text-[clamp(4rem,9vw,8rem)] font-light uppercase leading-[0.82] text-[#1d171a]">
              The Beryl&apos;s edit
            </h2>
          </div>
          <div className="mt-10 grid gap-2 md:grid-cols-3">
            {categoryTiles.map(function (category) {
              return (
                <a key={category.id} href={category.href} className="group relative min-h-[420px] overflow-hidden bg-[#3f3037]">
                  <img src={category.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1d171a]/85 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="editorial-kicker text-[#f2c5d7]">{category.label}</p>
                    <h3 className="mt-1 font-serif text-4xl font-light uppercase">{category.title}</h3>
                    <p className="mt-2 max-w-xs text-xs leading-5 text-white/80">{category.copy}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid bg-[#fffdfd] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex items-center px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24 xl:px-24">
          <div className="max-w-xl">
            <p className="editorial-kicker text-[#984667]">Kumasi salon</p>
            <h2 className="mt-4 font-serif text-5xl font-light uppercase leading-[0.92] text-[#1d171a] sm:text-6xl">
              Careful beauty services with enough time for every client.
            </h2>
            <p className="mt-6 text-base leading-8 text-[#5f5157]">
              From braiding and makeup to nails and lashes, every appointment begins with the look you want and the details that matter to you.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
              {serviceCategories.map(function (category) {
                return (
                  <a key={category.id} href={'#/services?section=' + category.name.toLowerCase()} className="border-t border-[#cdb8c1] pt-4">
                    <p className="font-serif text-lg text-[#1d171a]">{category.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#75636b]">Explore services</p>
                  </a>
                )
              })}
            </div>
            <a href="#/services" className="mt-9 inline-flex border border-[#1d171a] bg-[#1d171a] px-8 py-3.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
              Explore services
            </a>
          </div>
        </div>
        <div className="grid min-h-[600px] grid-cols-2">
          {serviceCategories.map(function (category) {
            return (
              <a key={category.id} href={'#/services?section=' + category.name.toLowerCase()} className="group relative min-h-[300px] overflow-hidden bg-[#1d171a]">
                <img src={category.imageUrl} alt={category.name + ' service'} className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#29151f]/80 via-transparent to-transparent" />
                <p className="absolute inset-x-0 bottom-0 p-5 font-serif text-2xl text-white sm:p-7">{category.name}</p>
              </a>
            )
          })}
        </div>
      </section>

      <section className="campaign-grid bg-[#c992aa] px-6 py-16 text-center text-[#1d171a] sm:px-10 sm:py-20 lg:py-24">
        <p className="editorial-kicker">The Beryl&apos;s experience</p>
        <blockquote className="mx-auto mt-5 max-w-5xl font-serif text-5xl font-light uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
          Every appointment starts with listening to what you want and ends with a style that feels right for you.
        </blockquote>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.24em]">Beryl Vance — Founder</p>
      </section>
    </>
  )
}
