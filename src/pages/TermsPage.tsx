const sections = [
  {
    title: 'Bookings',
    content:
      'Appointments are subject to availability and each service category daily capacity. A booking is only confirmed once accepted by our team. We reserve the right to decline or reschedule a booking where necessary.',
  },
  {
    title: 'Payments',
    content:
      'Products and appointments may be paid for through Mobile Money or card, processed by a trusted third party payment provider. Prices are shown in Ghana Cedis and may change without prior notice, though your confirmed order or booking price will not change once paid.',
  },
  {
    title: 'Cancellations and rescheduling',
    content:
      'You may request to cancel or reschedule an appointment by contacting us directly. Products already paid for and dispatched are handled under our separate Refund Policy.',
  },
  {
    title: 'Conduct',
    content:
      'We ask all clients to arrive on time and treat our team and space with respect. We reserve the right to decline service to anyone behaving inappropriately toward staff or other clients.',
  },
  {
    title: 'Website use',
    content:
      'This website and its content, including photos, pricing and descriptions, belong to Beryl\u2019s Beauty Mark. You may not copy or reuse our content for commercial purposes without permission.',
  },
  {
    title: 'Changes to these terms',
    content:
      'We may update these terms from time to time as our services change. Continued use of this website after changes are posted means you accept the updated terms.',
  },
  {
    title: 'Contact us',
    content:
      'For questions about these terms, call 059 191 1212 or visit Beryl\u2019s Beauty Mark at Ayeduase Newsite, Kumasi.',
  },
]

export function TermsPage() {
  return (
    <main className="bg-[#fffdfd]">
      <section className="border-b border-[#d9c7cf] bg-[#ead2dd] px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#984667]">
            The fine print
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-[#1d171a] sm:text-6xl">
            Terms of Service
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f5157]">
            These terms explain the basics of using our website, booking appointments and shopping with Beryl's Beauty Mark.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a7183]">
            Last updated: July 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl divide-y divide-[#d9c7cf]">
          {sections.map((section) => (
            <article key={section.title} className="grid gap-4 py-8 first:pt-0 sm:grid-cols-[0.8fr_1.5fr] sm:gap-10">
              <h2 className="font-serif text-2xl text-[#1d171a]">{section.title}</h2>
              <p className="text-base leading-8 text-[#5f5157]">{section.content}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}