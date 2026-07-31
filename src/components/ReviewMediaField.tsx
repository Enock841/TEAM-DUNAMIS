import { useState, type ChangeEvent } from 'react'

const CLOUD_NAME = 'dwgeqdw4'
const UPLOAD_PRESET = 'salon_media'

type ReviewMediaFieldProps = {
  onChange: (url: string, mediaType: 'photo' | 'video') => void
}

export function ReviewMediaField({ onChange }: ReviewMediaFieldProps) {
  const [preview, setPreview] = useState('')
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
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData },
      )
      if (!response.ok) throw new Error('Upload failed, please try again.')

      const data = await response.json()
      const mediaType = data.resource_type === 'video' ? 'video' : 'photo'
      setPreview(data.secure_url)
      onChange(data.secure_url, mediaType)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#765b67]">
        Add a photo or video, optional
      </span>
      {preview && (
        <p className="mb-2 text-xs text-emerald-700">Uploaded, ready to submit.</p>
      )}
      <label className="flex h-13 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#cdb8c1] bg-[#fff9fb] text-sm font-semibold text-[#9f205f]">
        {uploading ? 'Uploading...' : preview ? 'Replace file' : 'Choose a photo or video'}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFile}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-xs text-[#984667]">{error}</p>}
    </div>
  )
}