import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, type AdminSettings, type AdminStaff } from '../../lib/api'
import { EmptyState, fieldClass, Notice, PageHeader, Panel, PrimaryButton } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

export function SettingsAdminPage() {
  const settingsLoader = useCallback(
    (token: string) => api.adminSettings(token),
    [],
  )
  const { data, setData, loading, error, setError, token } = useAdminResource(settingsLoader)
  const [staff, setStaff] = useState<AdminStaff[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) api.adminStaff(token).then(setStaff).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load staff.'))
  }, [token, setError])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !data) return
    const form = new FormData(event.currentTarget)
    const days = Object.keys(data.openingHours)
    const body: AdminSettings = {
      ...data,
      businessName: String(form.get('businessName')),
      phone: String(form.get('phone')),
      address: String(form.get('address')),
      openingHours: Object.fromEntries(days.map((day) => [day, String(form.get(`hours-${day}`))])),
      notifications: {
        bookingEmail: form.get('bookingEmail') === 'on',
        orderEmail: form.get('orderEmail') === 'on',
        lowStock: form.get('lowStock') === 'on',
      },
      paymentMethods: {
        mobileMoney: form.get('mobileMoney') === 'on',
        cash: form.get('cash') === 'on',
        card: form.get('card') === 'on',
      },
    }
    try { const saved = await api.updateAdminSettings(token, body); setData(saved); setMessage('Settings saved.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save settings.') }
  }

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    const form = new FormData(event.currentTarget)
    try {
      const result = await api.createAdminStaff(token, { name:String(form.get('name')), phone:String(form.get('phone')), password:String(form.get('password')) })
      setStaff((items) => [...items, result.staff]); event.currentTarget.reset(); setMessage('Staff account created.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create staff account.') }
  }

  async function toggle(member: AdminStaff) {
    if (!token) return
    try {
      const result = await api.updateAdminStaffStatus(token, member.id, !member.isActive)
      setStaff((items) => items.map((item) => item.id === member.id ? result.staff : item))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update staff account.') }
  }

  return (
    <>
      <PageHeader eyebrow="Settings" title="Business configuration" description="Manage salon details, operating hours, staff, notifications and payment methods." />
      {loading && <div className="mt-8"><Notice>Loading settings…</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {message && <div className="mt-8"><Notice>{message}</Notice></div>}
      {data && (
        <form onSubmit={save} className="mt-8 grid gap-6 xl:grid-cols-2">
          <Panel>
            <h2 className="font-serif text-2xl text-[#1d171a]">Business information</h2>
            <div className="mt-5 grid gap-4">
              <input name="businessName" required defaultValue={data.businessName} className={fieldClass} aria-label="Business name" />
              <input name="phone" required defaultValue={data.phone} className={fieldClass} aria-label="Business phone" />
              <input name="address" required defaultValue={data.address} className={fieldClass} aria-label="Business address" />
            </div>
          </Panel>
          <Panel>
            <h2 className="font-serif text-2xl text-[#1d171a]">Operating hours</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(data.openingHours).map(([day, hours]) => <label key={day} className="text-xs font-bold capitalize text-[#76515f]">{day}<input name={`hours-${day}`} defaultValue={hours} className={`${fieldClass} mt-1 font-normal`} /></label>)}</div>
          </Panel>
          <Panel>
            <h2 className="font-serif text-2xl text-[#1d171a]">Notifications</h2>
            <div className="mt-5 grid gap-3">{[['bookingEmail','Booking updates'],['orderEmail','Order updates'],['lowStock','Low-stock alerts']].map(([key,label]) => <label key={key} className="flex items-center gap-3 text-sm"><input name={key} type="checkbox" defaultChecked={data.notifications[key]} className="h-4 w-4 accent-[#984667]" />{label}</label>)}</div>
          </Panel>
          <Panel>
            <h2 className="font-serif text-2xl text-[#1d171a]">Payment methods</h2>
            <div className="mt-5 grid gap-3">{[['mobileMoney','Mobile Money'],['cash','Cash'],['card','Card']].map(([key,label]) => <label key={key} className="flex items-center gap-3 text-sm"><input name={key} type="checkbox" defaultChecked={data.paymentMethods[key]} className="h-4 w-4 accent-[#984667]" />{label}</label>)}</div>
          </Panel>
          <div className="xl:col-span-2"><PrimaryButton type="submit">Save all settings</PrimaryButton></div>
        </form>
      )}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="font-serif text-2xl text-[#1d171a]">Staff accounts</h2>
          <div className="mt-5 space-y-3">
            {staff.length === 0 && (
              <EmptyState
                title="No additional staff"
                description="Create an administrator account when another team member needs access."
              />
            )}
            {staff.map((member) => <div key={member.id} className="flex items-center justify-between rounded-xl bg-[#f7e8ee] p-3"><div><strong className="text-sm">{member.name}</strong><span className="block text-xs text-[#6b5a62]">{member.phone}</span></div><button onClick={() => toggle(member)} className={`min-h-9 text-xs font-bold ${member.isActive ? 'text-red-600' : 'text-emerald-700'}`}>{member.isActive ? 'Deactivate' : 'Activate'}</button></div>)}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-serif text-2xl text-[#1d171a]">Add administrator</h2>
          <form onSubmit={addStaff} className="mt-5 grid gap-3">
            <input aria-label="Staff full name" name="name" required placeholder="Full name" className={fieldClass} />
            <input aria-label="Staff phone number" name="phone" required placeholder="Phone number" className={fieldClass} />
            <input aria-label="Temporary staff password" name="password" required type="password" minLength={8} placeholder="Temporary password" className={fieldClass} />
            <PrimaryButton type="submit">Create staff account</PrimaryButton>
          </form>
        </Panel>
      </div>
    </>
  )
}
