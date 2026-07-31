import { useState, type ChangeEvent } from 'react'

const CLOUD_NAME = 'dwgeqdw4'
const UPLOAD_PRESET = 'salon_media'

type ImageUploadFieldProps = {
  label: string
  value: string
  onChange: (url: string) => void
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      )

      if (!response.ok) throw new Error('Upload failed, please try again.')

      const data = await response.json()
      onChange(data.secure_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#956f80]">
        {label}
      </span>

      {value && (
        <img
          src={value}
          alt=""
          className="mb-3 h-32 w-full rounded-xl object-cover border border-[#d9c7cf]"
        />
      )}

      <label className="flex h-13 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#d99eb7] bg-[#fff9fb] text-sm font-semibold text-[#9f205f] hover:bg-[#fdeef4]">
        {uploading ? 'Uploadingâ€¦' : value ? 'Replace photo' : 'Upload a photo'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="mt-2 text-xs text-[#984667]">{error}</p>}
    </div>
  )
}