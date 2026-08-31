"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, Printer, Tags, Eye } from "lucide-react"

interface ElloraOrderItemOption {
  option_name: string
  option_value_name?: string
  option_type?: string
  price?: number | string
  quantity?: number
}

interface ElloraOrderItem {
  product_id: number
  product_name: string
  quantity: number
  price: number | string
  total: number | string
  options?: ElloraOrderItemOption[]
}

interface ElloraManagerOrder {
  order_id: number
  customer_name: string
  email: string | null
  telephone: string | null
  delivery_address: string | null
  delivery_notes: string | null
  order_comment: string | null
  delivery_date_time: string
  order_status: number
  order_total: number | string
  status_label: string
  item_count: number
  items: ElloraOrderItem[]
}

interface ManagerOrdersResponse {
  delivery_date: string
  summary: {
    total_orders: number
    total_customers: number
    total_items: number
    total_value: number
    placed_before_2pm: boolean
  }
  orders: ElloraManagerOrder[]
}

const money = (v: number | string) => `$${Number(v || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string) => {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
}

const statusStyle = (label: string): string => {
  switch (label) {
    case "Approved":
      return "bg-green-50 text-green-700 border border-green-200"
    case "Rejected":
      return "bg-red-50 text-red-700 border border-red-200"
    case "Awaiting Approval":
    case "Pending Payment":
      return "bg-amber-50 text-amber-700 border border-amber-200"
    default:
      return "bg-orange-50 text-orange-600 border border-orange-200"
  }
}

export default function ElloraOrdersPage() {
  const [detailsOrder, setDetailsOrder] = useState<ElloraManagerOrder | null>(null)
  const [dateMode, setDateMode] = useState<"all" | "today" | "custom">("today")
  const [customDate, setCustomDate] = useState<string>("")

  const dateParam = dateMode === "all" ? "all" : dateMode === "custom" ? customDate : undefined

  const { data, isLoading, refetch, isFetching } = useQuery<ManagerOrdersResponse>({
    queryKey: ["ellora-manager-orders", dateMode, customDate],
    queryFn: async () => {
      const params = dateParam ? { date: dateParam } : {}
      const response = await api.get("/admin/ellora/orders", { params })
      return response.data
    },
  })

  const summary = data?.summary
  const orders = data?.orders || []
  const scopeLabel = dateMode === "all" ? "All dates" : dateMode === "today" ? "Today" : (customDate || "Selected date")

  return (
    <div className="bg-gray-50 min-h-screen p-6" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Showing: {scopeLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateMode}
            onChange={(e) => setDateMode(e.target.value as "all" | "today" | "custom")}
            className="h-11 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="custom">Specific Date</option>
          </select>
          {dateMode === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-11 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
            />
          )}
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2 h-11 px-5 rounded-lg border-gray-200 text-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Production sheet is always the chef's list for today's deliveries.
              window.open(`/admin/ellora/orders/production-summary`, "_blank")
            }}
            className="flex items-center gap-2 h-11 px-5 rounded-lg border-gray-200 text-gray-700"
          >
            <Printer className="h-4 w-4" />
            Print Production Summary
          </Button>
          <Button
            onClick={() => {
              // Feature to be implemented.
            }}
            className="flex items-center gap-2 h-11 px-5 rounded-lg bg-[#243F2A] hover:bg-[#1A2E1E] text-white"
          >
            <Tags className="h-4 w-4" />
            Print All Labels
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
        <SummaryCard label="Total Orders" value={summary ? String(summary.total_orders) : "-"} suffix={scopeLabel} />
        <SummaryCard label="Total Customers" value={summary ? String(summary.total_customers) : "-"} />
        <SummaryCard label="Total Items" value={summary ? String(summary.total_items) : "-"} suffix="units" />
        <SummaryCard label="Total Order Value" value={summary ? money(summary.total_value) : "-"} />
        <SummaryCard label="Delivery Scope" value={scopeLabel} valueClass="text-green-600" />
      </div>

      {/* Orders table */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#243F2A]">Orders Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Order ID", "Customer", "Order Details", "Delivery Date", "Email", "Phone", "Delivery Details", "Notes", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No orders found.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.order_id} className="align-top hover:bg-gray-50/60">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">#{o.order_id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{o.customer_name || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                    <span className="font-medium">{o.item_count} items</span>
                    <button onClick={() => setDetailsOrder(o)} className="block text-xs text-[#243F2A] underline hover:opacity-80">
                      See details
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(o.delivery_date_time)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{o.email || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{o.telephone || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[220px]">{o.delivery_address || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px]">{o.delivery_notes || o.order_comment || "-"}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(o.status_label)}`}>
                      {o.status_label}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setDetailsOrder(o)}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-[#243F2A] hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100">
            Showing {orders.length} order{orders.length === 1 ? "" : "s"}
          </div>
        )}
      </Card>

      {/* Details modal */}
      <Dialog open={!!detailsOrder} onOpenChange={(open) => !open && setDetailsOrder(null)}>
        <DialogContent className="sm:max-w-[560px] bg-white">
          <DialogHeader>
            <DialogTitle>Order #{detailsOrder?.order_id} — {detailsOrder?.customer_name}</DialogTitle>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-gray-800">{detailsOrder.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-gray-800">{detailsOrder.telephone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Delivery Details</p>
                  <p className="text-gray-800">{detailsOrder.delivery_address || "-"}</p>
                </div>
                {detailsOrder.delivery_notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Notes</p>
                    <p className="text-gray-800">{detailsOrder.delivery_notes}</p>
                  </div>
                )}
                {detailsOrder.order_comment && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Comments</p>
                    <p className="text-gray-800">{detailsOrder.order_comment}</p>
                  </div>
                )}
              </div>

              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-gray-500">Product</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase text-gray-500">Qty</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase text-gray-500">Price</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailsOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-gray-800">
                          {it.product_name}
                          {(it.options || []).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {(it.options || []).map((opt, i) => (
                                <div key={i} className="text-xs text-gray-500">
                                  + {opt.option_name}{opt.option_value_name ? `: ${opt.option_value_name}` : ""}
                                  {Number(opt.price) > 0 ? ` (${money(opt.price || 0)})` : ""}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-sm text-gray-800 text-right">{money(it.price)}</td>
                        <td className="px-3 py-2 text-sm text-gray-800 text-right">{money(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-gray-700">Order Total</span>
                <span className="text-lg font-bold text-[#243F2A]">{money(detailsOrder.order_total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, value, suffix, valueClass }: { label: string; value: string; suffix?: string; valueClass?: string }) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-xl p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-xl font-bold ${valueClass || "text-gray-900"}`}>{value}</span>
        {suffix && <span className="text-sm text-gray-400">{suffix}</span>}
      </div>
    </Card>
  )
}
