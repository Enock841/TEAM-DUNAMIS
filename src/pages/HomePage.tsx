import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProductCard } from '../components/ProductCard'
import { useAppData } from '../context/appData'
import { imageBase, type Product } from '../data/catalog'
import logoPink from '../assets/beryls-logo-pink.png'
import {
  api,
  type HeroSlide,
  type Review,
  type ShopCategoryTile,
} from '../lib/api'

type HomePageProps = {
  onAdd: (product: Product) => void
}

/* ------------------------------------------------------------------ data */

const announcements = [
  'Free delivery on orders over GHS 800',
  '100% virgin human hair',
  'Same-week appointments in Kumasi',
  'New arrivals every Friday',
]

const featureStrip = [
  {
    title: 'Premium Quality',
    copy: '100 percent virgin human hair that lasts.',
  },
  {
    title: 'Easy Appointments',
    copy: 'Book your appointment online in minutes.',
  },
  {
    title: 'Nationwide Shipping',
    copy: 'Fast, secure delivery to your door.',
  },
  {
    title: 'Luxury Experience',
    copy: 'Because you deserve the very best.',
  },
]

const stats = [
  { value: 2400, suffix: '+', label: 'Happy clients' },
  { value: 9, suffix: ' yrs', label: 'Behind the chair' },
  { value: 98, suffix: '%', label: 'Rebooking rate' },
  { value: 4.9, suffix: '', label: 'Average rating', decimals: 1 },
]

const bookingSteps = [
  {
    step: '01',
    title: 'Choose your look',
    copy: 'Browse braiding, makeup, nails and lashes, then pick the service that fits.',
  },
  {
    step: '02',
    title: 'Pick your slot',
    copy: 'Select a date and time that works for you for instant confirmation.',
  },
  {
    step: '03',
    title: 'Sit back',
    copy: 'Arrive, relax, and let our stylists handle every detail with care.',
  },
]

const faqs = [
  {
    q: 'How long does an appointment usually take?',
    a: 'Most braiding appointments run between 3 and 6 hours depending on the style and length. Makeup, nails and lashes typically take 45 to 90 minutes.',
  },
  {
    q: 'Is the hair really 100 percent human hair?',
    a: 'Yes. Every bundle, closure and frontal we sell is virgin human hair that can be bleached, coloured and heat styled.',
  },
  {
    q: 'Where do you deliver?',
    a: 'We deliver nationwide across Ghana. Orders within Kumasi and Accra arrive in 1 to 3 days, and other regions typically take 3 to 5 working days.',
  },
  {
    q: 'Can I bring my own hair to an appointment?',
    a: 'Absolutely. Just mention it when booking so we can allocate the right amount of time for your install.',
  },
]

const fallbackTestimonials = [
  {
    name: 'Ama Serwaa',
    quote:
      'I came in for a Goddess Braid touch up and left with the neatest parting I have had in years. Booked my next appointment before I even left the chair.',
  },
  {
    name: 'Efia Mensah',
    quote:
      'Ordered the closure bundle from the shop and it matched my natural hair perfectly. The delivery was quick and the quality genuinely lasted months.',
  },
  {
    name: 'Nana Akosua',
    quote:
      'My stylist actually listened to what I wanted instead of just doing her own thing. First salon in Kumasi where I have felt properly heard.',
  },
]

/* ----------------------------------------------------------------- hooks */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(
    function () {
      const node = ref.current

      if (!node || shown) return

      if (typeof IntersectionObserver === 'undefined') {
        setShown(true)
        return
      }

      const observer = new IntersectionObserver(
        function (entries) {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setShown(true)
              observer.disconnect()
            }
          }
        },
        { threshold: 0.15 },
      )

      observer.observe(node)

      return function () {
        observer.disconnect()
      }
    },
    [shown],
  )

  return { ref, shown }
}

function Reveal(props: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reveal = useReveal<HTMLDivElement>()

  return (
    <div
      ref={reveal.ref}
      className={props.className}
      style={{
        opacity: reveal.shown ? 1 : 0,
        transform: reveal.shown ? 'none' : 'translateY(28px)',
        transition:
          'opacity 700ms ease, transform 700ms cubic-bezier(0.22,1,0.36,1)',
        transitionDelay: (props.delay || 0) + 'ms',
      }}
    >
      {props.children}
    </div>
  )
}

function CountUp(props: {
  value: number
  suffix?: string
  decimals?: number
}) {
  const reveal = useReveal<HTMLSpanElement>()
  const [display, setDisplay] = useState(0)
  const decimals = props.decimals || 0

  useEffect(
    function () {
      if (!reveal.shown) return

      const duration = 1400
      const start = performance.now()
      let frame = 0

      function tick(now: number) {
        const progress = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)

        setDisplay(props.value * eased)

        if (progress < 1) {
          frame = requestAnimationFrame(tick)
        }
      }

      frame = requestAnimationFrame(tick)

      return function () {
        cancelAnimationFrame(frame)
      }
    },
    [reveal.shown, props.value],
  )

  return (
    <span ref={reveal.ref}>
      {display.toFixed(decimals)}
      {props.suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ bits */

function Stars(props: { count?: number; className?: string }) {
  const count = props.count || 5
  const items = []

  for (let i = 0; i < count; i++) {
    items.push(i)
  }

  return (
    <span className={props.className}>
      {items.map(function (n) {
        return <span key={n}>&#9733;</span>
      })}
    </span>
  )
}

function SectionHeading(props: {
  eyebrow: string
  title: string
  copy?: string
}) {
  return (
    <Reveal className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc2d83] sm:text-[11px] sm:tracking-[0.28em]">
        {props.eyebrow}
      </p>

      <h2 className="mt-2 font-serif text-3xl leading-tight text-[#3e2530] sm:mt-3 sm:text-5xl">
        {props.title}
      </h2>

      <div className="mx-auto mt-3 flex items-center justify-center gap-3 sm:mt-4">
        <span className="h-px w-8 bg-[#e2b8ca] sm:w-10" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#dc2d83]" />
        <span className="h-px w-8 bg-[#e2b8ca] sm:w-10" />
      </div>

      {props.copy && (
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#745f68] sm:mt-5 sm:text-base sm:leading-7">
          {props.copy}
        </p>
      )}
    </Reveal>
  )
}

/* ---------------------------------------------------------------- announcement */

function AnnouncementBar() {
  const line = announcements.concat(announcements)

  return (
    <div className="overflow-hidden bg-[#3e2530] py-2.5 text-white">
      <div className="flex w-max animate-[bbm-marquee_38s_linear_infinite] gap-10 whitespace-nowrap pr-10">
        {line.map(function (item, index) {
          return (
            <span
              key={item + index}
              className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.24em]"
            >
              <span className="h-1 w-1 rounded-full bg-[#f2a7c9]" />
              {item}
            </span>
          )
        })}
      </div>

      <style>
        {`
          @keyframes bbm-marquee {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }
        `}
      </style>
    </div>
  )
}

/* ---------------------------------------------------------------- HERO */

function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(function () {
    let cancelled = false

    api.heroSlides().then(function (data) {
      if (!cancelled) {
        setSlides(data)
      }
    })

    return function () {
      cancelled = true
    }
  }, [])

  useEffect(
    function () {
      if (slides.length < 2 || paused) return

      const timer = setInterval(function () {
        setIndex(function (current) {
          return (current + 1) % slides.length
        })
      }, 6000)

      return function () {
        clearInterval(timer)
      }
    },
    [slides, paused],
  )

  if (slides.length === 0) return null

  const slide = slides[index]

  function go(direction: number) {
    setIndex(function (current) {
      return (current + direction + slides.length) % slides.length
    })
  }

  return (
    <section
      data-home-hero
      onMouseEnter={function () {
        setPaused(true)
      }}
      onMouseLeave={function () {
        setPaused(false)
      }}
      className="
        relative isolate
        min-h-[520px]
        overflow-hidden
        bg-[#3e2530]
        text-white
        sm:min-h-[620px]
        lg:min-h-[720px]
      "
    >
      {/* HERO IMAGES */}

      {slides.map(function (item, itemIndex) {
        const active = itemIndex === index

        return (
          <img
            key={item.id}
            src={item.imageUrl}
            alt=""
            className="
              absolute inset-0 -z-30
              h-full w-full
              object-cover
              object-[68%_center]
              transition-[opacity,transform]
              duration-[1200ms]
              ease-out
              sm:object-[70%_center]
              lg:object-[68%_center]
            "
            style={{
              opacity: active ? 1 : 0,
              transform: active ? 'scale(1.025)' : 'scale(1)',
            }}
          />
        )
      })}

      {/* LEFT DARK GRADIENT */}

      <div
        className="
          absolute inset-0 -z-20
          bg-gradient-to-r
          from-[#1d0d15]/90
          via-[#29151f]/55
          via-[58%]
          to-transparent
        "
      />

      {/* MOBILE BOTTOM PROTECTION */}

      <div
        className="
          absolute inset-x-0 bottom-0 -z-20 h-60
          bg-gradient-to-t
          from-[#1d0d15]/70
          to-transparent
          lg:hidden
        "
      />

      {/* SUBTLE TINT */}

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#3e2530]/[0.06]" />

      {/* HERO CONTENT */}

      <div
        className="
          relative mx-auto flex
          min-h-[520px]
          max-w-7xl
          items-end
          px-5
          pb-20
          pt-16
          sm:min-h-[620px]
          sm:px-10
          sm:pb-24
          lg:min-h-[720px]
          lg:items-center
          lg:px-12
          lg:pb-16
        "
      >

        <div
          key={slide.id}
          className="
            mx-auto
            w-full
            max-w-[380px]
            text-center
            animate-[bbm-rise_800ms_cubic-bezier(0.22,1,0.36,1)_both]
            sm:max-w-[560px]
            lg:max-w-[680px]
          "
        >
          {/* LOGO */}

          <img
            src={logoPink}
            alt="Beryl's Beauty Mark"
            className="mx-auto h-24 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] sm:mx-0 sm:h-32"
          />

          {/* BRAND */}

          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#f2a7c9] drop-shadow sm:text-[11px] sm:tracking-[0.28em]">Welcome to</p>

          {/* MAIN TITLE */}

          <h1
            className="
              mx-auto
              mt-2
              max-w-[380px]
              font-serif
              text-[clamp(3.2rem,14vw,5.6rem)]
              leading-[0.9]
              tracking-[-0.045em]
              text-white
              drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]
              sm:mt-4
              sm:max-w-[560px]
              sm:text-[clamp(4rem,9vw,6.8rem)]
            "
          >
            <span className="text-white">Beryl&apos;s</span>{' '}
            <span className="bg-gradient-to-r from-[#f7b4d2] to-white bg-clip-text text-transparent">
              Beauty Mark
            </span>
          </h1>

          {slide.title && (
            <p className="mx-auto mt-4 max-w-[380px] font-serif text-xl italic text-[#f7b4d2] drop-shadow sm:mx-0 sm:max-w-[500px] sm:text-2xl">
              {slide.title}
            </p>
          )}

          {slide.subtitle && (
            <p className="mx-auto mt-3 max-w-[340px] text-sm leading-6 text-white/85 drop-shadow sm:mx-0 sm:max-w-[460px] sm:text-base">
              {slide.subtitle}
            </p>
          )}

          {/* BUTTONS */}

          <div
            className="
              mt-6
              flex
              flex-row
              items-center
              justify-center
              gap-2.5
              sm:mt-8
              sm:gap-3
            "
          >
            <a
              href="#/shop"
              className="
                group
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-1.5
                rounded-full
                bg-[#dc2d83]
                px-5
                py-2.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-white
                shadow-[0_16px_45px_rgba(220,45,131,0.4)]
                transition
                hover:-translate-y-0.5
                hover:bg-[#b92068]
                sm:min-h-12
                sm:px-8
                sm:py-3.5
                sm:text-xs
              "
            >
              Shop now

              <span className="transition-transform group-hover:translate-x-1">
                &#8594;
              </span>
            </a>

            <a
              href="#/appointments"
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                rounded-full
                border
                border-white/80
                bg-black/10
                px-5
                py-2.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-white
                backdrop-blur-sm
                transition
                hover:-translate-y-0.5
                hover:bg-white
                hover:text-[#3e2530]
                sm:min-h-12
                sm:px-8
                sm:py-3.5
                sm:text-xs
              "
            >
              Book now
            </a>
          </div>

          {/* RATING */}

          <div className="mt-4 flex items-center justify-start gap-2 sm:mt-6">
            <Stars className="flex gap-0.5 text-[10px] text-[#f5c56e] sm:text-sm" />

            <span className="text-[9px] font-semibold text-white drop-shadow sm:text-sm">
              4.9/5 &bull; 2,400+ Happy Clients
            </span>
          </div>
        </div>
      </div>

      {/* SLIDER ARROWS */}

      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={function () {
              go(-1)
            }}
            className="
              absolute
              left-5
              top-1/2
              z-10
              hidden
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/60
              bg-black/10
              text-white
              backdrop-blur-md
              transition
              hover:bg-white
              hover:text-[#3e2530]
              sm:flex
              lg:left-8
            "
          >
            &#8592;
          </button>

          <button
            aria-label="Next slide"
            onClick={function () {
              go(1)
            }}
            className="
              absolute
              right-5
              top-1/2
              z-10
              hidden
              h-11
              w-11
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/60
              bg-black/10
              text-white
              backdrop-blur-md
              transition
              hover:bg-white
              hover:text-[#3e2530]
              sm:flex
              lg:right-8
            "
          >
            &#8594;
          </button>

          {/* DOTS */}

          <div className="absolute bottom-5 left-5 z-10 flex gap-2 sm:bottom-8 sm:left-10 lg:left-12">
            {slides.map(function (item, dotIndex) {
              return (
                <button
                  key={item.id}
                  aria-label={'Show slide ' + (dotIndex + 1)}
                  onClick={function () {
                    setIndex(dotIndex)
                  }}
                  className="h-1.5 overflow-hidden rounded-full transition-all duration-300"
                  style={{
                    width: dotIndex === index ? 32 : 7,
                    backgroundColor:
                      dotIndex === index
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {dotIndex === index && (
                    <span
                      key={'bar-' + index + '-' + String(paused)}
                      className="block h-full rounded-full bg-white"
                      style={{
                        animation: paused
                          ? 'none'
                          : 'bbm-progress 6s linear forwards',
                        width: paused ? '100%' : undefined,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* CURVED WAVE DIVIDER */}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] leading-none">
        <svg
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          className="block h-[60px] w-full sm:h-[90px] lg:h-[110px]"
          aria-hidden="true"
        >
          <path
            d="M0,96 C240,140 480,120 720,88 C960,56 1200,20 1440,34 L1440,130 L0,130 Z"
            fill="#f7e4ec"
          />
          <path
            d="M0,96 C240,140 480,120 720,88 C960,56 1200,20 1440,34"
            fill="none"
            stroke="#c9a24a"
            strokeWidth="3"
          />
          <path
            d="M0,112 C240,152 480,132 720,102 C960,72 1200,40 1440,52 L1440,130 L0,130 Z"
            fill="#dc2d83"
            opacity="0.9"
          />
        </svg>
      </div>

      <style>
        {`
          @keyframes bbm-progress {
            from {
              width: 0;
            }

            to {
              width: 100%;
            }
          }

          @keyframes bbm-rise {
            from {
              opacity: 0;
              transform: translateY(26px);
            }

            to {
              opacity: 1;
              transform: none;
            }
          }
        `}
      </style>
    </section>
  )
}

/* ---------------------------------------------------------------- stats */

function StatsBand() {
  return (
    <section className="bg-[#fffaf8] px-4 pb-4 sm:px-10 lg:px-12">
      <div
        className="
          mx-auto
          grid
          max-w-7xl
          grid-cols-2
          gap-3
          rounded-[1.25rem]
          border border-[#ecd8e1]
          bg-white/60
          p-4
          sm:grid-cols-4
          sm:gap-6
          sm:rounded-[1.5rem]
          sm:p-8
        "
      >
        {stats.map(function (item, itemIndex) {
          return (
            <Reveal
              key={item.label}
              delay={itemIndex * 90}
              className="text-center"
            >
              <p className="font-serif text-2xl text-[#dc2d83] sm:text-5xl">
                <CountUp
                  value={item.value}
                  suffix={item.suffix}
                  decimals={item.decimals}
                />
              </p>

              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#745f68] sm:mt-2 sm:text-[10px] sm:tracking-[0.14em]">
                {item.label}
              </p>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ booking */

function BookingSteps() {
  return (
    <section className="bg-white px-5 py-14 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Simple process"
          title="How booking works"
          copy="Three easy steps between you and your next favourite look."
        />

        <div className="mt-9 grid gap-4 md:grid-cols-3 lg:mt-12 lg:gap-6">
          {bookingSteps.map(function (item, itemIndex) {
            return (
              <Reveal key={item.step} delay={itemIndex * 120}>
                <div className="group relative h-full overflow-hidden rounded-[1.25rem] border border-[#ecd8e1] bg-[#fffaf8] p-5 transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(62,37,48,0.5)] sm:p-8">
                  <span className="font-serif text-4xl text-[#f0cadb] transition group-hover:text-[#dc2d83] sm:text-5xl">
                    {item.step}
                  </span>

                  <p className="mt-3 font-serif text-xl text-[#3e2530] sm:mt-4 sm:text-2xl">
                    {item.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#745f68] sm:mt-3 sm:leading-7">
                    {item.copy}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- FAQ */

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-[#fffaf8] px-5 py-14 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Good to know" title="Frequently asked" />

        <div className="mt-8 divide-y divide-[#ecd8e1] rounded-[1.25rem] border border-[#ecd8e1] bg-white px-5 sm:mt-10 sm:px-6">
          {faqs.map(function (item, itemIndex) {
            const isOpen = open === itemIndex

            return (
              <div key={item.q} className="py-5">
                <button
                  onClick={function () {
                    setOpen(isOpen ? null : itemIndex)
                  }}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base text-[#3e2530] sm:text-lg">
                    {item.q}
                  </span>

                  <span
                    className="flex-none text-xl text-[#dc2d83] transition-transform duration-300"
                    style={{
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  className="grid transition-all duration-400 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="pt-3 text-sm leading-7 text-[#745f68]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- newsletter */

function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <section className="bg-white px-5 pb-14 sm:px-10 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-5xl rounded-[1.5rem] bg-[#3e2530] px-5 py-9 text-center text-white sm:px-14 sm:py-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f2a7c9] sm:text-[11px] sm:tracking-[0.28em]">
          Stay in the loop
        </p>

        <h2 className="mt-3 font-serif text-2xl sm:text-4xl">
          Get 10% off your first order
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/70 sm:mt-4 sm:leading-7">
          New arrivals, restock alerts and appointment openings, straight to
          your inbox.
        </p>

        <form
          className="mx-auto mt-6 flex max-w-md flex-col gap-2.5 sm:mt-7 sm:flex-row"
          onSubmit={function (event) {
            event.preventDefault()

            if (email.trim()) {
              setSent(true)
            }
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={function (event) {
              setEmail(event.target.value)
            }}
            placeholder="Your email address"
            className="min-h-11 flex-1 rounded-full border border-white/40 bg-white/20 px-5 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/80 focus:border-[#f2a7c9] focus:bg-white/25 sm:min-h-12 sm:px-6"
          />

          <button className="min-h-11 rounded-full bg-[#dc2d83] px-7 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#b92068] sm:min-h-12 sm:px-8 sm:text-xs sm:tracking-[0.16em]">
            {sent ? 'Subscribed' : 'Subscribe'}
          </button>
        </form>

        {sent && (
          <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-[#f2a7c9]">
            Thank you, check your inbox.
          </p>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ floating book */

function FloatingBook() {
  const [visible, setVisible] = useState(false)

  useEffect(function () {
    function onScroll() {
      setVisible(window.scrollY > 700)
    }

    onScroll()

    window.addEventListener('scroll', onScroll, {
      passive: true,
    })

    return function () {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <a
      href="#/appointments"
      className="
        fixed bottom-4 right-4 z-40
        inline-flex items-center gap-2
        rounded-full
        bg-[#dc2d83]
        px-4 py-2.5
        text-[9px] font-bold
        uppercase tracking-[0.14em]
        text-white
        shadow-[0_18px_40px_-16px_rgba(220,45,131,0.9)]
        transition-all duration-300
        hover:bg-[#b92068]
        sm:bottom-6
        sm:right-6
        sm:px-6
        sm:py-3.5
        sm:text-xs
      "
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(24px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      Book now
    </a>
  )
}

/* ------------------------------------------------------------------ page */

export function HomePage(props: HomePageProps) {
  const onAdd = props.onAdd
  const appData = useAppData()

  const products = appData.products
  const services = appData.services
  const catalogLoading = appData.catalogLoading
  const catalogError = appData.catalogError

  /* ------------------------------------------------------------ categories */

  const [categoryTiles, setCategoryTiles] = useState<ShopCategoryTile[]>([])

  useEffect(function () {
    let cancelled = false

    api.shopCategoryTiles().then(function (data) {
      if (!cancelled) {
        setCategoryTiles(data)
      }
    })

    return function () {
      cancelled = true
    }
  }, [])

  /* -------------------------------------------------------------- reviews */

  const [realReviews, setRealReviews] = useState<Review[]>([])

  useEffect(function () {
    let cancelled = false

    api.reviews().then(function (data) {
      if (!cancelled) {
        setRealReviews(data)
      }
    })

    return function () {
      cancelled = true
    }
  }, [])

  /* -------------------------------------------------------------- services */

  const categoryMap = new Map<
    string,
    {
      id: string
      name: string
      imageUrl: string
    }
  >()

  for (const service of services) {
    categoryMap.set(service.category.name, {
      id: service.category.id,
      name: service.category.name,
      imageUrl: service.category.imageUrl || service.images[0] || '',
    })
  }

  const orderList = ['Braiding', 'Makeup', 'Nails', 'Lashes']

  const serviceCategories = Array.from(categoryMap.values()).sort(
    function (first, second) {
      const firstIndex = orderList.indexOf(first.name)
      const secondIndex = orderList.indexOf(second.name)

      return (
        (firstIndex === -1 ? 999 : firstIndex) -
        (secondIndex === -1 ? 999 : secondIndex)
      )
    },
  )

  /* --------------------------------------------------------------- gallery */

  const galleryImages = categoryTiles
    .map(function (tile) {
      return tile.imageUrl
    })
    .concat(
      serviceCategories.map(function (category) {
        return category.imageUrl
      }),
    )
    .filter(Boolean)
    .slice(0, 6)

  /* ----------------------------------------------------------- product tabs */

  const [tab, setTab] = useState<'all' | 'new' | 'best'>('all')

  const shownProducts = useMemo(
    function () {
      if (tab === 'new') {
        return products.slice(-4).reverse()
      }

      if (tab === 'best') {
        return products.slice(0, 4)
      }

      return products.slice(0, 6)
    },
    [products, tab],
  )

  /* ----------------------------------------------------------- testimonials */

  const realTestimonials = realReviews.slice(0, 6).map(function (review) {
    return {
      name: review.customerName,
      rating: review.rating,
      quote:
        review.comment ||
        'A genuinely wonderful experience from start to finish.',
      avatar:
        review.mediaType === 'photo' && review.mediaUrl
          ? review.mediaUrl
          : null,
    }
  })

  const fakeNeeded = Math.max(0, 3 - realTestimonials.length)

  const displayTestimonials = realTestimonials.concat(
    fallbackTestimonials.slice(0, fakeNeeded).map(function (item) {
      return {
        name: item.name,
        rating: 5,
        quote: item.quote,
        avatar: null,
      }
    }),
  )

  const [slot, setSlot] = useState(0)

  const pages = Math.max(
    1,
    Math.ceil(displayTestimonials.length / 3),
  )

  useEffect(
    function () {
      if (pages < 2) return

      const timer = setInterval(function () {
        setSlot(function (current) {
          return (current + 1) % pages
        })
      }, 7000)

      return function () {
        clearInterval(timer)
      }
    },
    [pages],
  )

  const visibleTestimonials = displayTestimonials.slice(
    slot * 3,
    slot * 3 + 3,
  )

  /* ---------------------------------------------------------------- render */

  return (
    <>
      <AnnouncementBar />

      <HeroBanner />

      {/* -------------------------------------------------------- features */}

      <section className="relative z-10 bg-[#fffaf8] px-4 sm:px-10 lg:px-12">
        <div
          className="
            mx-auto mt-6 max-w-7xl
            rounded-[1.25rem]
            bg-white
            p-4
            shadow-[0_20px_60px_-30px_rgba(62,37,48,0.35)]
            sm:mt-10
            sm:rounded-[1.5rem]
            sm:p-8
          "
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#ecd8e1]">
            {featureStrip.map(function (feature, featureIndex) {
              return (
                <Reveal
                  key={feature.title}
                  delay={featureIndex * 80}
                >
                  <div className="flex items-start gap-3 lg:px-6">
                    <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-[#dc2d83]" />

                    <div>
                      <p className="font-serif text-base text-[#3e2530] sm:text-lg">
                        {feature.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#745f68] sm:text-sm sm:leading-6">
                        {feature.copy}
                      </p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ stats */}

      <div className="bg-[#fffaf8] pt-8 sm:pt-14">
        <StatsBand />
      </div>

      {/* --------------------------------------------------------- categories */}

      <section className="bg-[#fffaf8] px-5 py-12 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our collection"
            title="Shop our collection"
            copy="Bundles, closures, frontals and everything you need for a flawless install."
          />

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-12 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {categoryTiles.map(function (category, categoryIndex) {
              return (
                <Reveal
                  key={category.id}
                  delay={categoryIndex * 60}
                >
                  <a
                    href={category.href}
                    className="
                      group flex h-full
                      flex-col overflow-hidden
                      rounded-xl
                      bg-white
                      ring-1 ring-[#ecd8e1]
                      transition
                      hover:-translate-y-1
                      hover:shadow-[0_18px_40px_-24px_rgba(62,37,48,0.4)]
                    "
                  >
                    <div className="relative aspect-[4/4.6] overflow-hidden bg-[#f7e4ec] sm:aspect-[3/4]">
                      <img
                        src={category.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#29151f]/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>

                    <div className="p-2.5 sm:p-4">
                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3e2530] sm:text-[10px]">
                        {category.label}
                      </p>

                      <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#745f68] sm:mt-2 sm:text-xs sm:leading-5">
                        {category.copy}
                      </p>

                      <span className="mt-2 inline-block text-[8px] font-bold uppercase tracking-[0.12em] text-[#dc2d83] sm:mt-3 sm:text-[10px]">
                        Shop now
                      </span>
                    </div>
                  </a>
                </Reveal>
              )
            })}
          </div>

          <div className="mt-7 text-center sm:mt-10">
            <a
              href="#/shop"
              className="inline-flex rounded-full bg-[#dc2d83] px-6 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#b92068] sm:px-8 sm:py-3.5 sm:text-xs"
            >
              View all products
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ appointment */}

      <section className="bg-[#fffaf8] px-5 pb-12 sm:px-10 lg:px-12 lg:pb-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[1.5rem] bg-[#f7e4ec] lg:grid-cols-2">
          <div className="flex items-center px-6 py-9 sm:px-12 sm:py-16">
            <div className="max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc2d83] sm:text-[11px] sm:tracking-[0.28em]">
                Your time, your beauty
              </p>

              <h2 className="mt-3 font-serif text-2xl leading-tight text-[#3e2530] sm:mt-4 sm:text-[2.75rem]">
                Book your luxury appointment
              </h2>

              <p className="mt-4 text-sm leading-6 text-[#745f68] sm:mt-5 sm:text-base sm:leading-7">
                Experience personalized care, flawless installs, and premium
                service tailored just for you.
              </p>

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 sm:mt-6 sm:gap-x-5">
                {[
                  'Expert stylists',
                  'Premium service',
                  'Relaxing atmosphere',
                ].map(function (item) {
                  return (
                    <span
                      key={item}
                      className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#3e2530] sm:text-[10px] sm:tracking-[0.1em]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#dc2d83]" />
                      {item}
                    </span>
                  )
                })}
              </div>

              <a
                href="#/appointments"
                className="mt-7 inline-flex rounded-full bg-[#dc2d83] px-7 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#b92068] sm:mt-8 sm:px-8 sm:py-3.5 sm:text-xs"
              >
                Book appointment
              </a>
            </div>
          </div>

          <div className="relative min-h-[250px] lg:min-h-[440px]">
            <img
              src={
                serviceCategories[0]
                  ? serviceCategories[0].imageUrl
                  : imageBase
              }
              alt="Salon interior"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- booking */}

      <BookingSteps />

      {/* --------------------------------------------------------- products */}

      <section className="bg-[#fffaf8] px-4 py-12 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Popular picks"
            title="Client favourites"
          />

          {/* PRODUCT TABS */}

          <div className="mt-6 flex justify-center sm:mt-8">
            <div className="inline-flex rounded-full border border-[#ecd8e1] bg-white p-1">
              {(
                [
                  ['all', 'All'],
                  ['new', 'New in'],
                  ['best', 'Best sellers'],
                ] as const
              ).map(function (item) {
                const active = tab === item[0]

                return (
                  <button
                    key={item[0]}
                    onClick={function () {
                      setTab(item[0])
                    }}
                    className="
                      rounded-full
                      px-3
                      py-1.5
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.1em]
                      transition
                      sm:px-5
                      sm:py-2
                      sm:text-[10px]
                      sm:tracking-[0.12em]
                    "
                    style={{
                      backgroundColor: active
                        ? '#dc2d83'
                        : 'transparent',
                      color: active
                        ? '#ffffff'
                        : '#745f68',
                    }}
                  >
                    {item[1]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* COMPACT PRODUCT GRID */}

          <div
            className="
              mx-auto
              mt-7
              grid
              max-w-4xl
              grid-cols-2
              gap-2.5
              sm:mt-10
              sm:grid-cols-3
              sm:gap-3
              lg:grid-cols-3
              lg:gap-6
            "
          >
            {catalogLoading && (
              <p className="col-span-2 text-center text-sm text-[#745f68] lg:col-span-3">
                Loading client favourites...
              </p>
            )}

            {!catalogLoading && catalogError && (
              <p className="col-span-2 text-center text-sm text-[#745f68] lg:col-span-3">
                We could not load products right now. Please refresh.
              </p>
            )}

            {!catalogLoading &&
              !catalogError &&
              shownProducts.map(function (product, productIndex) {
                return (
                  <Reveal
                    key={product.id}
                    delay={productIndex * 70}
                    className="h-full"
                  >
                    <div
                      className="
                        mx-auto
                        h-full
                        w-full
                      "
                    >
                      <ProductCard
                        product={product}
                        onAdd={onAdd}
                      />
                    </div>
                  </Reveal>
                )
              })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- services */}

      <section className="grid bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center px-5 py-12 sm:px-10 sm:py-20 lg:px-12 lg:py-24 xl:px-20">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc2d83] sm:text-[11px] sm:tracking-[0.28em]">
              Kumasi salon
            </p>

            <h2 className="mt-3 font-serif text-2xl leading-tight text-[#3e2530] sm:mt-4 sm:text-5xl">
              Careful beauty services with enough time for every client.
            </h2>

            <p className="mt-5 text-sm leading-7 text-[#745f68] sm:mt-6 sm:text-base sm:leading-8">
              From braiding and makeup to nails and lashes, every appointment
              begins with the look you want and the details that matter to you.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:mt-7 sm:gap-x-5">
              {serviceCategories.map(function (category) {
                return (
                  <a
                    key={category.id}
                    href={
                      '#/services?section=' +
                      category.name.toLowerCase()
                    }
                    className="group border-t border-[#e2b8ca] pt-3 sm:pt-4"
                  >
                    <p className="font-serif text-base text-[#3e2530] transition group-hover:text-[#dc2d83] sm:text-lg">
                      {category.name}
                    </p>

                    <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-[#8f707d] sm:text-[9px] sm:tracking-[0.12em]">
                      Explore services
                    </p>
                  </a>
                )
              })}
            </div>

            <a
              href="#/services"
              className="mt-7 inline-flex rounded-full bg-[#dc2d83] px-7 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#b92068] sm:mt-8 sm:px-8 sm:py-3.5 sm:text-xs"
            >
              Explore services
            </a>
          </div>
        </div>

        <div className="grid min-h-[420px] grid-cols-2 sm:min-h-[500px]">
          {serviceCategories.map(function (category) {
            return (
              <a
                key={category.id}
                href={
                  '#/services?section=' +
                  category.name.toLowerCase()
                }
                className="group relative min-h-[210px] overflow-hidden bg-[#4b2637] sm:min-h-[250px]"
              >
                <img
                  src={category.imageUrl}
                  alt={category.name + ' service'}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#29151f]/75 via-transparent to-transparent" />

                <p className="absolute inset-x-0 bottom-0 p-3 font-serif text-lg text-white sm:p-7 sm:text-2xl">
                  {category.name}
                </p>
              </a>
            )
          })}
        </div>
      </section>

      {/* ----------------------------------------------------- testimonials */}

      <section className="bg-[#fffaf8] px-5 py-12 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Client love"
            title="What our clients say"
          />

          <div
            key={slot}
            className="mt-8 grid animate-[bbm-rise_600ms_ease_both] gap-4 md:grid-cols-3 lg:mt-12"
          >
            {visibleTestimonials.map(function (item, itemIndex) {
              const avatar =
                item.avatar ||
                galleryImages[itemIndex] ||
                imageBase

              return (
                <figure
                  key={item.name + '-' + itemIndex}
                  className="
                    rounded-[1.25rem]
                    bg-white
                    p-5
                    ring-1
                    ring-[#ecd8e1]
                    transition
                    hover:-translate-y-1
                    hover:shadow-[0_24px_50px_-32px_rgba(62,37,48,0.5)]
                    sm:p-7
                  "
                >
                  <span className="block font-serif text-4xl leading-none text-[#f0cadb]">
                    &#8220;
                  </span>

                  <Stars count={item.rating} className="mt-3 flex gap-0.5 text-sm text-[#c8952f]" />

                  <blockquote className="mt-3 text-sm leading-6 text-[#745f68]">
                    {item.quote}
                  </blockquote>

                  <figcaption className="mt-6 flex items-center gap-3">
                    <img
                      src={avatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                    />

                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3e2530] sm:text-[10px] sm:tracking-[0.12em]">
                      {item.name}
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>

          {pages > 1 && (
            <div className="mt-7 flex justify-center gap-2">
              {Array.from({ length: pages }).map(function (
                _unused,
                pageIndex,
              ) {
                return (
                  <button
                    key={'t-dot-' + pageIndex}
                    aria-label={
                      'Testimonial page ' + (pageIndex + 1)
                    }
                    onClick={function () {
                      setSlot(pageIndex)
                    }}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width:
                        pageIndex === slot ? 24 : 8,
                      backgroundColor:
                        pageIndex === slot
                          ? '#dc2d83'
                          : 'rgba(62,37,48,0.2)',
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- gift card */}

      <section className="bg-white px-5 pb-12 sm:px-10 lg:px-12 lg:pb-20">
        <div
          className="
            mx-auto grid max-w-7xl
            items-center gap-5
            overflow-hidden
            rounded-[1.5rem]
            border border-[#ecd8e1]
            bg-[#f7e4ec]
            p-5
            sm:p-12
            lg:grid-cols-[1.2fr_0.8fr]
          "
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc2d83] sm:text-[11px] sm:tracking-[0.28em]">
              Give the glow
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#3e2530] sm:text-4xl">
              Gift cards for every occasion
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-[#745f68] sm:mt-4 sm:leading-7">
              Treat someone to bundles, a braiding session or a full glam
              appointment. Delivered instantly, redeemable in salon or online.
            </p>
          </div>

          <a
            href="#/gift-cards"
            className="inline-flex w-fit rounded-full bg-[#3e2530] px-7 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:-translate-y-0.5 hover:bg-[#291620] sm:px-8 sm:py-3.5 sm:text-xs lg:justify-self-end"
          >
            Buy a gift card
          </a>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}

      <FaqSection />

      {/* ------------------------------------------------------------ gallery */}

      <section className="bg-[#f7e4ec] px-5 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dc2d83] sm:text-[11px] sm:tracking-[0.28em]">
                Follow our journey
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#3e2530] sm:text-4xl">
                @berylsbeautymark
              </h2>
            </div>

            <a
              href="#/shop"
              className="w-fit text-[9px] font-bold uppercase tracking-[0.14em] text-[#dc2d83] sm:text-[10px] sm:tracking-[0.16em]"
            >
              View our Instagram
            </a>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-1.5 sm:mt-7 sm:gap-4 lg:grid-cols-6">
            {galleryImages.map(function (image, imageIndex) {
              return (
                <div
                  key={'gallery-' + imageIndex}
                  className="group relative aspect-square overflow-hidden rounded-md bg-[#f7e4ec] sm:rounded-lg"
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-[#29151f]/45 opacity-0 transition group-hover:opacity-100">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                      View
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- newsletter */}

      <Newsletter />

      {/* ----------------------------------------------------------- founder */}

      <section className="relative overflow-hidden bg-[#4b2637] px-5 py-12 text-center text-white sm:px-10 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#dc2d83]/25 blur-3xl" />

        <blockquote className="mx-auto max-w-4xl font-serif text-2xl leading-snug sm:text-4xl lg:text-5xl">
          Every appointment starts with listening to what you want and ends
          with a style that feels right for you.
        </blockquote>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f2a7c9] sm:mt-7 sm:text-[11px] sm:tracking-[0.28em]">
          Beryl Vance, Founder
        </p>
      </section>

      <FloatingBook />
    </>
  )
}