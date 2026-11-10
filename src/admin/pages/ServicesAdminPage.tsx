import { useCallback, useEffect, useState } from 'react'
import { useAppData } from '../../context/appData'
import { api } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { ImageUploadField } from '../components/ImageUploadField'
import { formatDuration } from '../../data/catalog'

export function ServicesAdminPage() {
  const appData = useAppData()
  const services = appData.services
  const refreshCatalog = appData.refreshCatalog
  const token = appData.token

  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [lengthsByService, setLengthsByService] = useState({})
  const [lengthForms, setLengthForms] = useState({})
  const [sizesByService, setSizesByService] = useState({})
  const [sizeForms, setSizeForms] = useState({})

  const loadCategories = useCallback(function () {
    return api.categories().then(setCategories)
  }, [])

  useEffect(function () { loadCategories() }, [loadCategories])

  function openForm(service) {
    setEditing(service)
    setImageUrl(service ? service.images[0] : '')
    setShowForm(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (!token) return
    const form = new FormData(event.currentTarget)
    const body = {
      name: String(form.get('name')),
      description: String(form.get('description')),
      categoryId: String(form.get('categoryId')),
      durationMinutes: Math.round(Number(form.get('durationHours')) * 60),
      priceMin: Number(form.get('price')),
      priceMax: Number(form.get('price')),
      images: imageUrl ? [imageUrl] : [],
    }
    try {
      if (editing) await api.updateService(token, editing.id, body)
      else await api.createService(token, body)
      setEditing(null)
      setShowForm(false)
      setMessage('Service saved.')
      await refreshCatalog()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to save service.')
    }
  }

  async function remove(service) {
    if (!token || !window.confirm('Remove ' + service.name + '?')) return
    try {
      await api.deleteService(token, service.id)
      await refreshCatalog()
      setMessage('Service removed.')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to remove service.')
    }
  }

  async function toggleLengths(serviceId) {
    setLengthsByService(function (current) {
      if (current[serviceId]) {
        const next = { ...current }
        delete next[serviceId]
        return next
      }
      return current
    })
    if (lengthsByService[serviceId]) return

    try {
      const options = await api.serviceLengthOptions(serviceId)
      const sizes = await api.lengthSizeOptions(serviceId)
      setSizesByService(function (current) {
        return { ...current, [serviceId]: sizes }
      })
      setLengthsByService(function (current) {
        return { ...current, [serviceId]: options }
      })
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to load lengths.')
    }
  }

  function updateLengthForm(serviceId, field, value) {
    setLengthForms(function (current) {
      const existing = current[serviceId] || { label: '', priceMin: '', priceMax: '', imageUrl: '' }
      return { ...current, [serviceId]: { ...existing, [field]: value } }
    })
  }

  async function addLength(serviceId) {
    if (!token) return
    const draft = lengthForms[serviceId]
    if (!draft || !draft.label || !draft.priceMin || !draft.priceMax) {
      setMessage('Fill in a label and both prices before adding a length.')
      return
    }
    try {
      await api.createServiceLengthOption(token, {
        serviceId: serviceId,
        label: draft.label,
        priceMin: Number(draft.priceMin),
        priceMax: Number(draft.priceMax),
        sortOrder: 0,
        imageUrl: draft.imageUrl || undefined,
      })
      setLengthForms(function (current) {
        const next = { ...current }
        delete next[serviceId]
        return next
      })
      const options = await api.serviceLengthOptions(serviceId)
      setLengthsByService(function (current) {
        return { ...current, [serviceId]: options }
      })
      setMessage('Length option added.')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to add length.')
    }
  }

  function updateSizeForm(lengthId, field, value) {
    setSizeForms(function (current) {
      const existing = current[lengthId] || { label: '', price: '' }
      return { ...current, [lengthId]: { ...existing, [field]: value } }
    })
  }

  async function reloadSizes(serviceId) {
    const sizes = await api.lengthSizeOptions(serviceId)
    setSizesByService(function (current) {
      return { ...current, [serviceId]: sizes }
    })
  }

  async function addSize(serviceId, lengthId) {
    if (!token) return
    const draft = sizeForms[lengthId]
    if (!draft || !draft.label || draft.price === '' || draft.price === undefined) {
      setMessage('Fill in a size name and a price before adding a size.')
      return
    }
    try {
      await api.createLengthSizeOption(token, { lengthOptionId: lengthId, label: draft.label, price: Number(draft.price) })
      setSizeForms(function (current) {
        const next = { ...current }
        delete next[lengthId]
        return next
      })
      await reloadSizes(serviceId)
      setMessage('Size added.')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to add size.')
    }
  }

  async function removeSize(serviceId, sizeId) {
    if (!token || !window.confirm('Remove this size?')) return
    try {
      await api.deleteLengthSizeOption(token, sizeId)
      await reloadSizes(serviceId)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to remove size.')
    }
  }

  async function removeLength(serviceId, optionId) {
    if (!token || !window.confirm('Remove this length option?')) return
    try {
      await api.deleteServiceLengthOption(token, optionId)
      const options = await api.serviceLengthOptions(serviceId)
      setLengthsByService(function (current) {
        return { ...current, [serviceId]: options }
      })
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to remove length.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Salon service catalogue"
        description="Create, price, organize and retire bookable salon services."
        action={<PrimaryButton onClick={function () { openForm(null) }}>Add service</PrimaryButton>}
      />
      {message && <div className="mt-6"><Notice>{message}</Notice></div>}

      {showForm && (
        <Panel className="mt-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <input name="name" required defaultValue={editing ? editing.name : ''} placeholder="Service name" className={fieldClass} />
            <select name="categoryId" required defaultValue={editing ? editing.category.id : ''} className={fieldClass}>
              {categories.map(function (category) {
                return <option key={category.id} value={category.id}>{category.name}</option>
              })}
            </select>
            <textarea name="description" required defaultValue={editing ? editing.description : ''} placeholder="Description" className={fieldClass + ' h-24 py-3 md:col-span-2'} />
            <input name="durationHours" required type="number" min="0.25" step="0.25" defaultValue={editing ? editing.durationMinutes / 60 : 1} placeholder="Duration in hours, e.g. 1.5" className={fieldClass} />
            <div className="md:col-span-2">
              <ImageUploadField label="Service photo" value={imageUrl} onChange={setImageUrl} />
            </div>
            <input name="price" required type="number" min="0" defaultValue={editing ? editing.priceMin : ''} placeholder="Price (GHC)" className={fieldClass} />
            <div className="flex gap-3 md:col-span-2">
              <PrimaryButton type="submit">Save service</PrimaryButton>
              <button type="button" onClick={function () { setShowForm(false) }} className="text-sm">Cancel</button>
            </div>
          </form>
        </Panel>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {services.map(function (service) {
          const lengths = lengthsByService[service.id]
          const sizes = sizesByService[service.id] || []
          const draft = lengthForms[service.id] || { label: '', priceMin: '', priceMax: '', imageUrl: '' }
          return (
            <Panel key={service.id}>
              <div className="flex gap-4">
                <img src={service.images[0]} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-xl text-[#3e2530]">{service.name}</p>
                  <p className="mt-1 text-xs text-[#8f7480]">
                    {service.category.name + ' - ' + formatDuration(service.durationMinutes) + ' - GHC ' + service.priceMin}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase">
                    <button onClick={function () { openForm(service) }} className="text-[#a52261]">Edit</button>
                    <button onClick={function () { remove(service) }} className="text-red-600">Delete</button>
                    <button onClick={function () { toggleLengths(service.id) }} className="text-[#604c55]">
                      {lengths ? 'Hide lengths' : 'Manage lengths'}
                    </button>
                  </div>
                </div>
              </div>

              {lengths && (
                <div className="mt-4 rounded-2xl bg-[#fff7fa] p-4">
                  {lengths.length === 0 && (
                    <p className="text-xs text-[#8f7480]">No length options yet, price stays as a single range above.</p>
                  )}
                  {lengths.map(function (option) {
                    return (
                      <div key={option.id} className="border-b border-[#f0dfe6] py-2 text-sm last:border-0">
                        <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          {option.imageUrl && <img src={option.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                          {option.label + ': GHC ' + option.priceMin}
                        </span>
                        <button onClick={function () { removeLength(service.id, option.id) }} className="text-xs font-bold text-red-600">
                          Remove
                        </button>
                        </div>
                        <div className="ml-4 mt-2 text-xs">
                          {sizes.filter(function (size) { return size.lengthOptionId === option.id }).map(function (size) {
                            return (
                              <div key={size.id} className="flex items-center justify-between gap-3 py-1">
                                <span>{'Size ' + size.label + ': GHC ' + size.price}</span>
                                <button onClick={function () { removeSize(service.id, size.id) }} className="font-bold text-red-600">Remove</button>
                              </div>
                            )
                          })}
                          <div className="mt-1 grid gap-2 sm:grid-cols-3">
                            <input
                              value={(sizeForms[option.id] || { label: '' }).label}
                              onChange={function (e) { updateSizeForm(option.id, 'label', e.target.value) }}
                              placeholder="Size, e.g. Medium"
                              className={fieldClass}
                            />
                            <input
                              value={(sizeForms[option.id] || { price: '' }).price}
                              onChange={function (e) { updateSizeForm(option.id, 'price', e.target.value) }}
                              type="number"
                              placeholder="Price (GHC)"
                              className={fieldClass}
                            />
                            <button
                              onClick={function () { addSize(service.id, option.id) }}
                              className="rounded-full border border-[#dc2d83] px-4 py-2 text-xs font-bold uppercase text-[#dc2d83]"
                            >
                              Add size
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <input
                      value={draft.label}
                      onChange={function (e) { updateLengthForm(service.id, 'label', e.target.value) }}
                      placeholder="e.g. Neck length"
                      className={fieldClass}
                    />
                    <input
                      value={draft.priceMin}
                      onChange={function (e) { updateLengthForm(service.id, 'priceMin', e.target.value); updateLengthForm(service.id, 'priceMax', e.target.value) }}
                      type="number"
                      placeholder="Price (GHC)"
                      className={fieldClass}
                    />
                    <button
                      onClick={function () { addLength(service.id) }}
                      className="rounded-full bg-[#dc2d83] px-4 py-2 text-xs font-bold uppercase text-white"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3">
                    <ImageUploadField
                      label="Photo for this length"
                      value={draft.imageUrl}
                      onChange={function (url) { updateLengthForm(service.id, 'imageUrl', url) }}
                    />
                  </div>
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </>
  )
}