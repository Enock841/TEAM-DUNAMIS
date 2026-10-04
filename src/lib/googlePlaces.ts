let loadPromise: Promise<void> | null = null

export function loadGooglePlaces(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as any
  if (w.google && w.google.maps && w.google.maps.places) return Promise.resolve()
  if (loadPromise) return loadPromise

  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
  if (!apiKey) return Promise.resolve()

  loadPromise = new Promise(function (resolve, reject) {
    const script = document.createElement('script')
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&libraries=places'
    script.async = true
    script.onload = function () { resolve() }
    script.onerror = function () { reject(new Error('Failed to load Google Maps')) }
    document.head.appendChild(script)
  })
  return loadPromise
}