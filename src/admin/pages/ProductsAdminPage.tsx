import { useState, type FormEvent } from 'react'
import { useAppData } from '../../context/appData'
import type { Product } from '../../data/catalog'
import { api } from '../../lib/api'
import { fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { ImageUploadField } from '../components/ImageUploadField'

export function ProductsAdminPage() {
  const { products, refreshCatalog, token } = useAppData()
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, any[]>>({})
  const [variantForms, setVariantForms] = useState<Record<string, any>>({})

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    const form = new FormData(event.currentTarget)
    const body = {
      name: String(form.get('name')), description: String(form.get('description')),
      category: String(form.get('category')), price: Number(form.get('price')),
      stockQty: Number(form.get('stockQty')),
      images: imageUrl ? [imageUrl] : [],
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

  async function toggleVariants(productId: string) {
    if (variantsByProduct[productId]) {
      setVariantsByProduct((current) => {
        const next = { ...current }
        delete next[productId]
        return next
      })
      return
    }
    if (!token) return
    try {
      const options = await api.adminProductVariants(token, productId)
      setVariantsByProduct((current) => ({ ...current, [productId]: options }))
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to load variants.')
    }
  }

  function updateVariantForm(productId: string, field: string, value: string) {
    setVariantForms((current) => {
            const existing = current[productId] || {
        label: '', price: '', stockQty: '', imageUrl: '',
        option1Name: '', option1Value: '', option1NameCustom: '',
        option2Name: '', option2Value: '', option2NameCustom: '',
      }
      return { ...current, [productId]: { ...existing, [field]: value } }
    })
  }

  async function addVariant(productId: string) {
    if (!token) return
    const draft = variantForms[productId]
    if (!draft || (!draft.label && !draft.option1Value) || !draft.price || draft.stockQty === '' || draft.stockQty === undefined) {
      setMessage('Fill in a price, stock quantity, and either a label or at least one option before adding a variant.')
      return
    }
        try {
      const resolvedOption1Name = draft.option1Name === 'Custom' ? draft.option1NameCustom : draft.option1Name
      const resolvedOption2Name = draft.option2Name === 'Custom' ? draft.option2NameCustom : draft.option2Name
      await api.createProductVariant(token, {
        productId,
        label: draft.label || undefined,
        price: Number(draft.price),
        stockQty: Number(draft.stockQty),
        imageUrl: draft.imageUrl || undefined,
        sortOrder: 0,
        option1Name: resolvedOption1Name || undefined,
        option1Value: draft.option1Value || undefined,
        option2Name: resolvedOption2Name || undefined,
        option2Value: draft.option2Value || undefined,
      })
      setVariantForms((current) => {
        const next = { ...current }
        delete next[productId]
        return next
      })
      const options = await api.adminProductVariants(token, productId)
      setVariantsByProduct((current) => ({ ...current, [productId]: options }))
      setMessage('Variant added.')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to add variant.')
    }
  }

  async function removeVariant(productId: string, variantId: string) {
    if (!token || !window.confirm('Remove this variant?')) return
    try {
      await api.deleteProductVariant(token, variantId)
      const options = await api.adminProductVariants(token, productId)
      setVariantsByProduct((current) => ({ ...current, [productId]: options }))
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to remove variant.')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Products" title="Inventory and products" description="Manage product details, prices and available stock." action={<PrimaryButton onClick={() => { setEditing(null); setImageUrl(''); setShowForm(true) }}>Add product</PrimaryButton>} />
      {message && <div className="mt-6"><Notice>{message}</Notice></div>}
      {showForm && (
        <Panel className="mt-6">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <input name="name" required defaultValue={editing?.name} placeholder="Product name" className={fieldClass} />
            <input name="category" required defaultValue={editing?.category} placeholder="Category" className={fieldClass} />
            <textarea name="description" required defaultValue={editing?.description} placeholder="Description" className={`${fieldClass} h-24 py-3 md:col-span-2`} />
            <input name="price" required type="number" min="0" defaultValue={editing?.price} placeholder="Price" className={fieldClass} />
            <input name="stockQty" required type="number" min="0" defaultValue={editing?.stockQty} placeholder="Stock quantity" className={fieldClass} />
            <div className="md:col-span-2"><ImageUploadField label="Product photo" value={imageUrl} onChange={setImageUrl} /></div>
            <div className="flex gap-3 md:col-span-2"><PrimaryButton type="submit">Save product</PrimaryButton><button type="button" onClick={() => setShowForm(false)} className="text-sm">Cancel</button></div>
          </form>
        </Panel>
      )}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#ead7df] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f8e7ee] text-xs uppercase text-[#76515f]"><tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>{products.map((product) => {
            const variants = variantsByProduct[product.id]
            const draft = variantForms[product.id] || { label: '', price: '', stockQty: '', imageUrl: '', option1Name: '', option1Value: '', option1NameCustom: '', option2Name: '', option2Value: '', option2NameCustom: '' }
            return (
              <>
                <tr key={product.id} className="border-t border-[#f0e2e8]">
                  <td className="p-4 font-semibold">{product.name}</td>
                  <td>{product.category}</td>
                  <td>GHC {product.price}</td>
                  <td><span className={product.stockQty <= 5 ? 'font-bold text-amber-600' : ''}>{product.stockQty}</span></td>
                  <td>
                    <div className="flex flex-wrap gap-4 text-xs font-bold uppercase">
                      <button onClick={() => { setEditing(product); setImageUrl(product.images[0] || ''); setShowForm(true) }} className="text-[#a52261]">Edit</button>
                      <button onClick={() => remove(product)} className="text-red-600">Delete</button>
                      <button onClick={() => toggleVariants(product.id)} className="text-[#604c55]">
                        {variants ? 'Hide variants' : 'Manage variants'}
                      </button>
                    </div>
                  </td>
                </tr>
                {variants && (
                  <tr key={product.id + '-variants'}>
                    <td colSpan={5} className="bg-[#fff7fa] p-4">
                      {variants.length === 0 && (
                        <p className="text-xs text-[#8f7480]">No colors or sizes yet, this product just sells at the single price above.</p>
                      )}
                      {variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between gap-3 border-b border-[#f0dfe6] py-2 text-sm last:border-0">
                          <span className="flex items-center gap-3">
                            {variant.imageUrl && <img src={variant.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                            {variant.label}
                            {variant.option1Name && <span className="text-xs text-[#a08a94]"> ({variant.option1Name}: {variant.option1Value}{variant.option2Name ? ', ' + variant.option2Name + ': ' + variant.option2Value : ''})</span>}
                            : GHC {variant.price}, {variant.stockQty} in stock
                          </span>
                          <button onClick={() => removeVariant(product.id, variant.id)} className="text-xs font-bold text-red-600">
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="mt-3 rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#a08a94]">
                          First choice, e.g. Scent, optional
                        </p>
                                                <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                          <select
                            value={draft.option1Name}
                            onChange={(e) => updateVariantForm(product.id, 'option1Name', e.target.value)}
                            className={fieldClass}
                          >
                            <option value="">Choose a type, optional</option>
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            <option value="Scent">Scent</option>
                            <option value="Flavor">Flavor</option>
                            <option value="Length">Length</option>
                            <option value="Material">Material</option>
                            <option value="Custom">Custom...</option>
                          </select>
                          <input
                            value={draft.option1Value}
                            onChange={(e) => updateVariantForm(product.id, 'option1Value', e.target.value)}
                            placeholder="Value, e.g. Vanilla"
                            className={fieldClass}
                          />
                        </div>
                        {draft.option1Name === 'Custom' && (
                          <input
                            value={draft.option1NameCustom}
                            onChange={(e) => updateVariantForm(product.id, 'option1NameCustom', e.target.value)}
                            placeholder="Type the choice name, e.g. Pattern"
                            className={`${fieldClass} mt-1.5`}
                          />
                        )}
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#a08a94]">
                          Second choice, e.g. Size, optional
                        </p>
                                                <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                          <select
                            value={draft.option2Name}
                            onChange={(e) => updateVariantForm(product.id, 'option2Name', e.target.value)}
                            className={fieldClass}
                          >
                            <option value="">Choose a type, optional</option>
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            <option value="Scent">Scent</option>
                            <option value="Flavor">Flavor</option>
                            <option value="Length">Length</option>
                            <option value="Material">Material</option>
                            <option value="Custom">Custom...</option>
                          </select>
                          <input
                            value={draft.option2Value}
                            onChange={(e) => updateVariantForm(product.id, 'option2Value', e.target.value)}
                            placeholder="Value, e.g. 50ml"
                            className={fieldClass}
                          />
                        </div>
                        {draft.option2Name === 'Custom' && (
                          <input
                            value={draft.option2NameCustom}
                            onChange={(e) => updateVariantForm(product.id, 'option2NameCustom', e.target.value)}
                            placeholder="Type the choice name, e.g. Pattern"
                            className={`${fieldClass} mt-1.5`}
                          />
                        )}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <input
                          value={draft.label}
                          onChange={(e) => updateVariantForm(product.id, 'label', e.target.value)}
                          placeholder="Label, only if not using choices above"
                          className={fieldClass}
                        />
                        <input
                          value={draft.price}
                          onChange={(e) => updateVariantForm(product.id, 'price', e.target.value)}
                          type="number"
                          placeholder="Price"
                          className={fieldClass}
                        />
                        <input
                          value={draft.stockQty}
                          onChange={(e) => updateVariantForm(product.id, 'stockQty', e.target.value)}
                          type="number"
                          placeholder="Stock quantity"
                          className={fieldClass}
                        />
                        <button
                          onClick={() => addVariant(product.id)}
                          className="rounded-full bg-[#dc2d83] px-4 py-2 text-xs font-bold uppercase text-white"
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-3">
                        <ImageUploadField
                          label="Photo for this variant, optional"
                          value={draft.imageUrl}
                          onChange={(url) => updateVariantForm(product.id, 'imageUrl', url)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}</tbody>
        </table>
      </div>
    </>
  )
}