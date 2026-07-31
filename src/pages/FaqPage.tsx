const faqs = [
  {
    question: 'How do I book a salon appointment?',
    answer:
      'Choose a service from the salon menu and select Book, or use the Book button in the navigation. Pick an available date and time, enter your details and confirm your request.',
  },
  {
    question: 'Are service prices fixed?',
    answer:
      'Displayed prices are starting prices. Your final price may vary depending on hair length, density, the selected style and any additional preparation required. We will confirm the price before your appointment.',
  },
  {
    question: 'Why are some braid appointments limited?',
    answer:
      'Longer services require more salon time. Appointment availability is limited by service duration so every client receives enough time and the salon avoids overbooking.',
  },
  {
    question: 'Can I buy products online?',
    answer:
      'Yes. Add available wigs, bundles or hair-care products to your bag and proceed to checkout. Products marked Out of Stock cannot be ordered until they are replenished.',
  },
  {
    question: 'Which payment methods are accepted?',
    answer:
      'Supported checkout methods may include Mobile Money and other available online payment options. The available methods will be shown when you complete your order or booking.',
  },
  {
    question: 'Where is the salon located?',
    answer:
      'Beryl’s Beauty Mark is located at Ayeduase Newsite in Kumasi, Ghana. Salon visits are by appointment.',
  },
  {
    question: 'How can I change or cancel an appointment?',
    answer:
      'Please call 059 191 1212 as early as possible. Cancellation and rescheduling terms may depend on the service and how close the request is to your appointment time.',
  },
]

export function FaqPage() {
  return (
    <main className="bg-[#fffdfd]">
      <section className="border-b border-[#d9c7cf] bg-[#1d171a] px-6 py-16 text-white sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9abbf]">
            Helpful details
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">
            Frequently asked questions
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">
            Quick answers about appointments, service pricing, products and
            visiting the salon.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="divide-y divide-[#d9c7cf] border-y border-[#d9c7cf]">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group py-6 sm:py-7">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 font-serif text-xl text-[#1d171a] sm:text-2xl">
                  <span>
                    <span className="mr-4 text-sm text-[#984667]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {faq.question}
                  </span>
                  <span aria-hidden="true" className="mt-1 text-2xl font-light text-[#984667] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pt-5 text-base leading-8 text-[#5f5157] sm:pl-10">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] bg-[#ead2dd] p-7 text-center sm:p-10">
            <h2 className="font-serif text-3xl text-[#1d171a]">
              Still need help?
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#5f5157]">
              Speak with the salon team for appointment or product guidance.
            </p>
            <a
              href="tel:0591911212"
              className="mt-6 inline-flex rounded-full bg-[#984667] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white"
            >
              Call 059 191 1212
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
