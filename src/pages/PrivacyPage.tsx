const sections = [
  {
    title: 'Information we collect',
    content:
      'When you enquire, book an appointment, create an account or place an order, we may collect your name, phone number, email address, delivery details, appointment preferences and payment confirmation details.',
  },
  {
    title: 'How we use your information',
    content:
      'We use your information to manage appointments, fulfil orders, provide customer support, send service updates and improve the salon and shopping experience. We do not sell your personal information.',
  },
  {
    title: 'Payments',
    content:
      'Payments may be processed by trusted mobile money or payment providers. Beryl’s Beauty Mark does not store your full payment credentials. Those providers process payment information under their own privacy terms.',
  },
  {
    title: 'Sharing and storage',
    content:
      'We only share information with service providers when necessary to operate the website, process payments, deliver orders or meet legal obligations. We retain information only for as long as it is reasonably needed for these purposes.',
  },
  {
    title: 'Your choices',
    content:
      'You may ask to access, correct or delete personal information we hold about you, subject to any information we are required to retain. You may also opt out of promotional messages at any time.',
  },
  {
    title: 'Contact us',
    content:
      'For privacy questions or requests, call 059 191 1212 or visit Beryl’s Beauty Mark at Ayeduase Newsite, Kumasi.',
  },
]

export function PrivacyPage() {
  return (
    <main className="bg-[#fffdfd]">
      <section className="border-b border-[#d9c7cf] bg-[#ead2dd] px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#984667]">
            Your information
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-[#1d171a] sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f5157]">
            This policy explains how Beryl&apos;s Beauty Mark handles information
            provided through our website, salon bookings and online shop.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#765762]">
            Last updated: July 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl divide-y divide-[#d9c7cf]">
          {sections.map((section) => (
            <article key={section.title} className="grid gap-4 py-8 first:pt-0 sm:grid-cols-[0.8fr_1.5fr] sm:gap-10">
              <h2 className="font-serif text-2xl text-[#1d171a]">
                {section.title}
              </h2>
              <p className="text-base leading-8 text-[#5f5157]">
                {section.content}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
