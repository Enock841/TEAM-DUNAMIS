import { useCallback } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

export function OverviewAdminPage() {
  const loader = useCallback((token: string) => api.adminAnalytics(token), [])
  const { data, loading, error } = useAdminResource(loader)
  const metrics = data?.metrics

  return (
    <>
      <PageHeader
        eyebrow="Command centre"
        title="Business overview"
        description="A live view of appointments, customers, orders and revenue across the salon."
      />
      {loading && <div className="mt-8"><Notice>Loading dashboard…</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Revenue', `GH₵${Number(metrics?.revenue ?? 0).toLocaleString()}`],
          ['Appointments', metrics?.appointments ?? 0],
          ['Orders', metrics?.orders ?? 0],
          ['Customers', metrics?.customers ?? 0],
        ].map(([label, value]) => (
          <Panel key={label}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#75636b]">{label}</p>
            <p className="mt-3 font-serif text-4xl text-[#984667]">{value}</p>
          </Panel>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-serif text-2xl text-[#1d171a]">Popular services</h2>
          <div className="mt-5 space-y-4">
            {data?.popularServices.map((item) => (
              <div key={item.name} className="flex justify-between border-b border-[#e6d9df] pb-3 text-sm">
                <span>{item.name}</span><strong>{item.bookings} bookings</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-serif text-2xl text-[#1d171a]">Best-selling products</h2>
          <div className="mt-5 space-y-4">
            {data?.bestSellingProducts.map((item) => (
              <div key={item.name} className="flex justify-between border-b border-[#e6d9df] pb-3 text-sm">
                <span>{item.name}</span><strong>{item.units} sold</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}
