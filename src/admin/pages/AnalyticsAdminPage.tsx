import { useCallback } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader, Panel } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

export function AnalyticsAdminPage() {
  const loader = useCallback((token: string) => api.adminAnalytics(token), [])
  const { data, loading, error } = useAdminResource(loader)
  const maxRevenue = Math.max(...(data?.revenueTrend.map((item) => Number(item.amount)) ?? [1]), 1)
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Performance insights" description="Revenue trends, popular services, product sales and customer growth." />
      {loading && <div className="mt-8"><Notice>Loading analytics…</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel className="lg:col-span-2">
          <h2 className="font-serif text-2xl text-[#1d171a]">Revenue trend</h2>
          <div className="mt-6 flex min-h-56 items-end gap-4 border-b border-[#d9c7cf]">
            {data?.revenueTrend.length ? data.revenueTrend.map((item) => <div key={item.month} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold">GH₵{Number(item.amount).toLocaleString()}</span><div className="w-full max-w-24 rounded-t-xl bg-[#984667]" style={{height:`${Math.max(12, Number(item.amount) / maxRevenue * 170)}px`}} /><span className="pb-2 text-xs text-[#6b5a62]">{item.month}</span></div>) : <p className="pb-8 text-sm text-[#6b5a62]">Revenue will appear after successful payments.</p>}
          </div>
        </Panel>
        <Panel><h2 className="font-serif text-2xl">Popular services</h2><div className="mt-5 space-y-3">{data?.popularServices.map((item) => <div key={item.name} className="flex justify-between"><span>{item.name}</span><strong>{item.bookings}</strong></div>)}</div></Panel>
        <Panel><h2 className="font-serif text-2xl">Product sales</h2><div className="mt-5 space-y-3">{data?.bestSellingProducts.map((item) => <div key={item.name} className="flex justify-between"><span>{item.name}</span><strong>{item.units}</strong></div>)}</div></Panel>
      </div>
    </>
  )
}
