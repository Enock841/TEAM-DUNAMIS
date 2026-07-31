import { useState, type FormEvent } from 'react'
import { useAppData } from '../../context/appData'
import type { Product } from '../../data/catalog'
import { api } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'

export function ProductsAdminPage() {
  const { products, refreshCatalog, token } = useAppData()
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    const form = new FormData(event.currentTarget)
    const body = {
      name: String(form.get('name')), description: String(form.get('description')),
      category: String(form.get('category')), price: Number(form.get('price')),
      stockQty: Number(form.get('stockQty')),
      images: String(form.get('image')).trim() ? [String(form.get('image')).trim()] : [],
    }
    try {
      if (editing) await api.updateProduct(token, editing.id, body)
      else await api.createProduct(token, body)
      setEditing(null); setShowForm(false); setMessage('Product saved.'); await refreshCatalog()
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to save product.') }
  }

  async function remove(product: Product) {
    if (!token || !window.confirm(`Remove ${product.name}?`)) return
    try { await api.deleteProduct(token, product.id); await refreshCatalog(); setMessage('Product removed.') }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to remove product.') }
  }

  return (
    <>
      <PageHeader eyebrow="Products" title="Inventory and products" description="Manage product details, prices and available stock." action={<PrimaryButton onClick={() => { setEditing(null); setShowForm(true) }}>Add product</PrimaryButton>} />
      {message && <div className="mt-6"><Notice>{message}</Notice></div>}
      {showForm && (
        <Panel className="mt-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <input name="name" required defaultValue={editing?.name} placeholder="Product name" className={fieldClass} />
            <input name="category" required defaultValue={editing?.category} placeholder="Category" className={fieldClass} />
            <textarea name="description" required defaultValue={editing?.description} placeholder="Description" className={`${fieldClass} h-24 py-3 md:col-span-2`} />
            <input name="price" required type="number" min="0" defaultValue={editing?.price} placeholder="Price" className={fieldClass} />
            <input name="stockQty" required type="number" min="0" defaultValue={editing?.stockQty} placeholder="Stock quantity" className={fieldClass} />
            <input name="image" defaultValue={editing?.images[0]} placeholder="Image URL or /images/path.jpg" className={`${fieldClass} md:col-span-2`} />
            <div className="flex gap-3 md:col-span-2"><PrimaryButton type="submit">Save product</PrimaryButton><button type="button" onClick={() => setShowForm(false)} className="text-sm">Cancel</button></div>
          </form>
        </Panel>
      )}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#d9c7cf] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f3e3ea] text-xs uppercase text-[#76515f]"><tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>{products.map((product) => <tr key={product.id} className="border-t border-[#e6d9df]"><td className="p-4 font-semibold">{product.name}</td><td>{product.category}</td><td>GH₵{product.price}</td><td><span className={product.stockQty <= 5 ? 'font-bold text-amber-600' : ''}>{product.stockQty}</span></td><td><div className="flex gap-4 text-xs font-bold uppercase"><button onClick={() => { setEditing(product); setShowForm(true) }} className="text-[#984667]">Edit</button><button onClick={() => remove(product)} className="text-red-600">Delete</button></div></td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}
