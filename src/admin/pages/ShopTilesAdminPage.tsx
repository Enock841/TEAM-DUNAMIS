import { useCallback, useState } from 'react'
import { api } from '../../lib/api'
import { EmptyState, fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'
import { ImageUploadField } from '../components/ImageUploadField'

export function ShopTilesAdminPage() {
  const loader = useCallback(function (token) { return api.adminShopCategoryTiles(token) }, [])
  const resource = useAdminResource(loader)
  const data = resource.data
  const loading = resource.loading
  const error = resource.error
  const setError = resource.setError
  const reload = resource.reload
  const token = resource.token
  const tiles = data ?? []

  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [message, setMessage] = useState('')

  function openForm(tile) {
    setEditing(tile)
    setImageUrl(tile ? tile.imageUrl : '')
    setShowForm(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (!token) return
    const form = new FormData(event.currentTarget)
    const body = {
      title: String(form.get('title')),
      label: String(form.get('label')),
      copy: String(form.get('copy')),
      imageUrl: imageUrl,
      href: String(form.get('href')),
      sortOrder: Number(form.get('sortOrder')),
    }
    try {
      if (editing) await api.updateShopCategoryTile(token, editing.id, body)
      else await api.createShopCategoryTile(token, body)
      setShowForm(false)
      setEditing(null)
      setMessage('Tile saved.')
      await reload()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to save tile.')
    }
  }

  async function toggleActive(tile) {
    if (!token) return
    try {
      await api.updateShopCategoryTile(token, tile.id, { isActive: !tile.isActive })
      await reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update tile.')
    }
  }

  async function remove(tile) {
    if (!token || !window.confirm('Delete this category tile?')) return
    try {
      await api.deleteShopCategoryTile(token, tile.id)
      await reload()
      setMessage('Tile removed.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove tile.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Homepage"
        title="Shop by category tiles"
        description="The three photo cards shown under the homepage hero."
        action={<PrimaryButton onClick={function () { openForm(null) }}>Add tile</PrimaryButton>}
      />
      {message && <div className="mt-6"><Notice>{message}</Notice></div>}
      {error && <div className="mt-6"><Notice error>{error}</Notice></div>}

      {showForm && (
        <Panel className="mt-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <input aria-label="Tile title" name="title" required defaultValue={editing ? editing.title : ''} placeholder="Title, e.g. Signature Wigs" className={fieldClass} />
            <input aria-label="Tile label" name="label" defaultValue={editing ? editing.label : ''} placeholder="Small label, e.g. Wigs" className={fieldClass} />
            <input aria-label="Tile order" name="sortOrder" type="number" defaultValue={editing ? editing.sortOrder : 0} placeholder="Order, lower shows first" className={fieldClass} />
            <input aria-label="Tile destination link" name="href" defaultValue={editing ? editing.href : '#/shop'} placeholder="Link, e.g. #/shop?category=Wigs" className={fieldClass} />
            <textarea aria-label="Tile description" name="copy" defaultValue={editing ? editing.copy : ''} placeholder="One line description" className={fieldClass + ' h-20 py-3 md:col-span-2'} />
            <div className="md:col-span-2">
              <ImageUploadField label="Tile photo" value={imageUrl} onChange={setImageUrl} />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <PrimaryButton type="submit">Save tile</PrimaryButton>
              <button type="button" onClick={function () { setShowForm(false) }} className="text-sm">Cancel</button>
            </div>
          </form>
        </Panel>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {loading && <Notice>Loading tiles...</Notice>}
        {!loading && !error && tiles.length === 0 && (
          <EmptyState
            title="No shop tiles yet"
            description="Add a tile to feature a category on the homepage."
          />
        )}
        {tiles.map(function (tile) {
          return (
            <Panel key={tile.id}>
              <div className="flex gap-4">
                <img src={tile.imageUrl} alt="" className="h-20 w-28 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg text-[#1d171a]">{tile.title}</p>
                  <p className="mt-1 text-xs text-[#75636b]">
                    Order {tile.sortOrder} - {tile.isActive ? 'Visible' : 'Hidden'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase">
                    <button onClick={function () { openForm(tile) }} className="text-[#984667]">Edit</button>
                    <button onClick={function () { toggleActive(tile) }} className="text-[#75636b]">
                      {tile.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={function () { remove(tile) }} className="text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>
    </>
  )
}
