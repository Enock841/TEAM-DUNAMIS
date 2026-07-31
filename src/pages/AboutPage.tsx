import { imageBase } from '../data/catalog'

export function AboutPage() {
  return (
    <main className="bg-[#fffdfd]">
      <section className="grid lg:grid-cols-2">
        <img
          src={`${imageBase}/hero-home.jpg`}
          alt="Beryl's Beauty Mark founder and hair model"
          className="h-[500px] w-full object-cover object-top sm:h-[620px] lg:h-[760px]"
        />
        <div className="flex items-center px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-16 xl:px-20 xl:py-24 2xl:px-24">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#984667]">
              Our story
            </p>
            <h1 className="mt-5 font-serif text-[42px] leading-tight text-[#1d171a] sm:text-6xl lg:text-5xl xl:text-6xl">
              Beautiful hair begins with being listened to.
            </h1>
            <p className="mt-6 text-base leading-8 text-[#5f5157]">
              Beryl&apos;s Beauty Mark is a Kumasi-based hair store and salon
              built around quality, honest guidance and personalised finishing.
              We select every texture carefully and give every appointment the
              time it deserves.
            </p>
            <p className="mt-5 text-base leading-8 text-[#5f5157]">
              Whether you are choosing a first wig, maintaining a favourite unit
              or booking a protective style, the experience should feel calm,
              considered and entirely yours.
            </p>
            <a
              href="#/appointments"
              className="mt-9 inline-flex rounded-full bg-[#984667] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white"
            >
              Visit the salon
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
