import { useCallback, useState } from 'react'
import { api } from '../../lib/api'
import { Notice, PageHeader } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

export function PaymentsAdminPage() {
  const loader = useCallback((token: string) => api.adminPayments(token), [])
  const { data = [], loading, error } = useAdminResource(loader)
  const revenue = data?.filter((item) => item.status === 'success').reduce((sum, item) => sum + Number(item.amount), 0) ?? 0
  const [search, setSearch] = useState('')
  const filtered = (data ?? []).filter((payment) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      payment.reference?.toLowerCase().includes(query) ||
      payment.customer?.name?.toLowerCase().includes(query) ||
      payment.customer?.phone?.toLowerCase().includes(query) ||
      payment.momoNumber?.toLowerCase().includes(query)
    )
  })
  return (
    <>
      <PageHeader eyebrow="Payments" title="Transactions" description={`Successful payment revenue: GHC${revenue.toLocaleString()}`} />
      {loading && <div className="mt-8"><Notice>Loading payments...</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by reference, customer name, or phone number"
        className="mt-8 h-12 w-full max-w-md rounded-xl border border-[#dfbdcb] bg-white px-4 text-sm outline-none focus:border-[#dc2d83]"
      />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ead7df] bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-[#f8e7ee] text-xs uppercase text-[#76515f]"><tr><th className="p-4">Reference</th><th>Customer</th><th>Type</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{filtered.map((payment) => <tr key={payment.id} className="border-t border-[#f0e2e8]"><td className="p-4 font-mono text-xs">{payment.reference}</td><td>{payment.customer?.name ?? 'Guest'}<span className="block text-xs text-[#806b74]">{payment.customer?.phone ?? ''}</span></td><td className="capitalize">{payment.paymentType}</td><td>{payment.momoNumber}</td><td>GHC{Number(payment.amount).toLocaleString()}</td><td><span className="rounded-full bg-[#f8e7ee] px-3 py-1 text-xs font-bold capitalize">{payment.status}</span></td><td>{new Date(payment.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}