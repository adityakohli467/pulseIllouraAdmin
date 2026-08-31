"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, ShoppingBag, DollarSign, Users, Package } from "lucide-react"

interface TopProduct {
  product_name: string
  quantity_sold: number
  revenue: number | string
}

interface RevenueDay {
  date: string
  orders: number
  revenue: number | string
}

interface StatusRow {
  order_status: number
  count: number
}

interface ReportResponse {
  range: { from: string | null; to: string | null }
  summary: {
    total_orders: number
    total_revenue: number
    avg_order_value: number
    unique_customers: number
    total_items: number
  }
  top_products: TopProduct[]
  revenue_by_day: RevenueDay[]
  orders_by_status: StatusRow[]
}

const money = (v: number | string) =>
  `$${Number(v || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string) => {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

const statusLabel = (status: number): string => {
  switch (Number(status)) {
    case 4: return "Awaiting Approval"
    case 7: return "Approved"
    case 8: return "Rejected"
    case 10: return "Pending Payment"
    default: return "To be Prepared"
  }
}

export default function CafeReportsPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [applied, setApplied] = useState<{ from: string; to: string }>({ from: "", to: "" })

  const { data, isLoading, isFetching, refetch } = useQuery<ReportResponse>({
    queryKey: ["cafe-reports", applied.from, applied.to],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (applied.from) params.from = applied.from
      if (applied.to) params.to = applied.to
      const response = await api.get("/admin/cafe/reports", { params })
      return response.data
    },
  })

  const summary = data?.summary
  const topProducts = data?.top_products || []
  const revenueByDay = data?.revenue_by_day || []
  const ordersByStatus = data?.orders_by_status || []

  const cards = [
    { label: "Total Orders", value: summary?.total_orders ?? 0, icon: ShoppingBag },
    { label: "Total Revenue", value: money(summary?.total_revenue ?? 0), icon: DollarSign },
    { label: "Avg Order Value", value: money(summary?.avg_order_value ?? 0), icon: DollarSign },
    { label: "Items Sold", value: summary?.total_items ?? 0, icon: Package },
    { label: "Customers", value: summary?.unique_customers ?? 0, icon: Users },
  ]

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Cafe Reports</h1>
          <p className="text-gray-500 mt-1">Sales performance for Cafe staff orders.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2 h-11 px-5 rounded-lg border-gray-200 text-gray-700"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Date filters */}
      <Card className="border-0 shadow-sm bg-white rounded-xl p-6 mb-8">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">From (delivery date)</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-12 border-gray-200 w-48" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">To (delivery date)</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-12 border-gray-200 w-48" />
          </div>
          <Button
            onClick={() => setApplied({ from, to })}
            className="h-12 px-6 rounded-lg bg-[#243F2A] hover:bg-[#1A2E1E] text-white font-semibold"
          >
            Apply
          </Button>
          {(applied.from || applied.to) && (
            <Button
              variant="outline"
              onClick={() => { setFrom(""); setTo(""); setApplied({ from: "", to: "" }) }}
              className="h-12 px-6 rounded-lg border-gray-200 text-gray-700"
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="border-0 shadow-sm bg-white rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#EAF0EC]">
                <c.icon className="h-5 w-5 text-[#243F2A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{isLoading ? "…" : c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading…</td></tr>
              ) : topProducts.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data.</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={`${p.product_name}-${i}`} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-sm text-gray-900">{p.product_name || "-"}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-900">{p.quantity_sold}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Orders by status */}
        <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Orders by Status</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={2} className="text-center py-8 text-gray-400">Loading…</td></tr>
              ) : ordersByStatus.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-8 text-gray-400">No data.</td></tr>
              ) : ordersByStatus.map((s) => (
                <tr key={s.order_status} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-sm text-gray-900">{statusLabel(s.order_status)}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-900">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Revenue by day */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl mt-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Revenue by Day</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading…</td></tr>
            ) : revenueByDay.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data.</td></tr>
            ) : revenueByDay.map((r) => (
              <tr key={r.date} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 text-sm text-gray-900">{formatDate(r.date)}</td>
                <td className="px-6 py-3 text-sm text-right text-gray-900">{r.orders}</td>
                <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{money(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
