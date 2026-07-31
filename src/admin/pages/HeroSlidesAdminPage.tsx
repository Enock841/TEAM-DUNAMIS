import { useCallback, useState, type FormEvent } from 'react'
import { api, type HeroSlide } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'
import { ImageUploadField } from '../components/ImageUploadField'

export function HeroSlidesAdminPage() {
  const loader = useCallback((token: string) => api.adminHeroSlides(token), [])
  const { data = [], loading, error, setError, reload, token } = useAdminResource(loader)
  const [editing, setEditing] = useState<HeroSlide | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [message, setMessage] = useState('')

  function openForm(slide: HeroSlide | null) {
    setEditing(slide)
    setImageUrl(slide?.imageUrl ?? '')
    setShowForm(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    const form = new FormData(event.currentTarget)
    const body = {
      eyebrow: String(form.get('eyebrow')),
      title: String(form.get('title')),
      subtitle: String(form.get('subtitle')),
      imageUrl,
      sortOrder: Number(form.get('sortOrder')),
    }
    try {
      if (editing) await api.updateHeroSlide(token, editing.id, body)
      else await api.createHeroSlide(token, body)
      setShowForm(false)
      setEditing(null)
      setMessage('Slide saved.')
      await reload()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to save slide.')
    }
  }

  async function toggleActive(slide: HeroSlide) {
    if (!token) return
    try {
      await api.updateHeroSlide(token, slide.id, { isActive: !slide.isActive })
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update slide.')
    }
  }

  async function remove(slide: HeroSlide) {
    if (!token || !window.confirm(`Delete this slide?`)) return
    try {
      await api.deleteHeroSlide(token, slide.id)
      await reload()
      setMessage('Slide removed.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove slide.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Homepage"
        title="Hero banner slides"
        description="The rotating photos and headlines shown at the top of the homepage."
        action={<PrimaryButton onClick={() => openForm(null)}>Add slide</PrimaryButton>}
      />
      {message && <div className="mt-6"><Notice>{message}</Notice></div>}
      {error && <div className="mt-6"><Notice error>{error}</Notice></div>}

      {showForm && (
        <Panel className="mt-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <input
              name="eyebrow"
              defaultValue={editing?.eyebrow}
              placeholder="Small label above the headline"
              className={fieldClass}
            />
            <input
              name="sortOrder"
              type="number"
              defaultValue={editing?.sortOrder ?? 0}
              placeholder="Order, lower shows first"
              className={fieldClass}
            />
            <input
              name="title"
              required
              defaultValue={editing?.title}
              placeholder="Main headline"
              className={`${fieldClass} md:col-span-2`}
            />
            <textarea
              name="subtitle"
              defaultValue={editing?.subtitle}
              placeholder="Supporting text under the headline"
              className={`${fieldClass} h-20 py-3 md:col-span-2`}
            />
            <div className="md:col-span-2">
              <ImageUploadField label="Slide photo" value={imageUrl} onChange={setImageUrl} />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <PrimaryButton type="submit">Save slide</PrimaryButton>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm">
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {loading && <Notice>Loading slides...</Notice>}
        {(data ?? []).map((slide) => (
          <Panel key={slide.id}>
            <div className="flex gap-4">
              <img src={slide.imageUrl} alt="" className="h-20 w-28 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg text-[#1d171a]">{slide.title}</p>
                <p className="mt-1 text-xs text-[#75636b]">
                  Order {slide.sortOrder} - {slide.isActive ? 'Visible' : 'Hidden'}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase">
                  <button onClick={() => openForm(slide)} className="text-[#984667]">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(slide)} className="text-[#75636b]">
                    {slide.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => remove(slide)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}
