import { useCallback } from 'react'
import { api } from '../../lib/api'
import { EmptyState, Notice, PageHeader } from '../components/AdminUi'
import { useAdminResource } from '../hooks/useAdminResource'

export function PaymentsAdminPage() {
  const loader = useCallback((token: string) => api.adminPayments(token), [])
  const { data = [], loading, error } = useAdminResource(loader)
  const revenue = data?.filter((item) => item.status === 'success').reduce((sum, item) => sum + Number(item.amount), 0) ?? 0
  return (
    <>
      <PageHeader eyebrow="Payments" title="Transactions" description={`Successful payment revenue: GH₵${revenue.toLocaleString()}`} />
      {loading && <div className="mt-8"><Notice>Loading payments…</Notice></div>}
      {error && <div className="mt-8"><Notice error>{error}</Notice></div>}
      {!loading && !error && data.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No transactions yet"
            description="Successful and pending payments will appear here."
          />
        </div>
      ) : (
      <div className="mt-8 overflow-x-auto rounded-2xl border border-[#d9c7cf] bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-[#f3e3ea] text-xs uppercase text-[#76515f]"><tr><th className="p-4">Reference</th><th>Customer</th><th>Type</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{data?.map((payment) => <tr key={payment.id} className="border-t border-[#e6d9df]"><td className="p-4 font-mono text-xs">{payment.reference}</td><td>{payment.customer.name}<span className="block text-xs text-[#6b5a62]">{payment.customer.phone}</span></td><td className="capitalize">{payment.paymentType}</td><td>{payment.momoNumber}</td><td>GH₵{Number(payment.amount).toLocaleString()}</td><td><span className="rounded-full bg-[#f3e3ea] px-3 py-1 text-xs font-bold capitalize">{payment.status}</span></td><td>{new Date(payment.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
      )}
    </>
  )
}
