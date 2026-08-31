"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, RefreshCw } from "lucide-react"

interface CafeOrderItemOption {
  option_name: string
  option_value_name?: string
  quantity?: number
}

interface CafeOrderItem {
  product_name: string
  quantity: number
  price: number | string
  total: number | string
  options?: CafeOrderItemOption[]
}

interface CafeManagerOrder {
  order_id: number
  customer_name: string
  email: string | null
  telephone: string | null
  delivery_address: string | null
  delivery_notes: string | null
  order_comment: string | null
  delivery_date_time: string
  cafe_delivery_method?: string | null
  cafe_time_type?: string | null
  cafe_scheduled_time?: string | null
  order_status: number
  order_total: number | string
  status_label: string
  item_count: number
  items: CafeOrderItem[]
}

interface ManagerOrdersResponse {
  delivery_date: string
  summary: {
    total_orders: number
    total_customers: number
    total_items: number
    total_value: number
  }
  orders: CafeManagerOrder[]
}

const money = (v: number | string) =>
  `$${Number(v || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string) => {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export default function CafeDashboardPage() {
  const printedRef = useRef(false)

  const { data, isLoading, isFetching, refetch } = useQuery<ManagerOrdersResponse>({
    queryKey: ["cafe-dashboard-orders"],
    queryFn: async () => {
      // No date param => today's deliveries.
      const res = await api.get("/admin/cafe/orders")
      return res.data
    },
  })

  const orders = data?.orders || []

  // Auto-open the print dialog once today's orders have loaded.
  useEffect(() => {
    if (!printedRef.current && data && orders.length > 0) {
      printedRef.current = true
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [data, orders.length])

  return (
    <div className="bg-gray-50 min-h-screen p-6 print:bg-white print:p-0" style={{ fontFamily: "Albert Sans" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <Link href="/admin/cafe/orders" className="print:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="h-4 w-4" /> All Orders
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Cafe Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${formatDate(data.delivery_date)} · ${data.summary.total_orders} order${data.summary.total_orders === 1 ? "" : "s"}` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="flex items-center gap-2 h-11 px-5 rounded-lg border-gray-200 text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-2 h-11 px-5 rounded-lg bg-[#243F2A] hover:bg-[#1A2E1E] text-white"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading today&apos;s orders…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No orders for today.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.order_id} className="break-inside-avoid border border-gray-200 rounded-xl bg-white p-4 print:border-gray-400">
                <div className="flex items-start justify-between gap-3 border-b border-dashed border-gray-200 pb-2 mb-2">
                  <div>
                    <p className="font-bold text-gray-900">Order #{o.order_id} — {o.customer_name || "-"}</p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold uppercase">{o.cafe_delivery_method === "pickup" ? "Pickup" : "Delivery"}</span>
                      {" · "}
                      {o.cafe_time_type === "scheduled" && o.cafe_scheduled_time ? o.cafe_scheduled_time : "ASAP"}
                    </p>
                    <p className="text-xs text-gray-500">{o.cafe_delivery_method === "pickup" ? "Pickup from store" : (o.delivery_address || "-")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{o.item_count} item{o.item_count === 1 ? "" : "s"}</p>
                    <p className="text-xs text-gray-500">{money(o.order_total)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="text-sm text-gray-800">
                      <span className="font-semibold">{it.quantity}×</span> {it.product_name}
                      {(it.options || []).length > 0 && (
                        <span className="text-gray-500">
                          {" "}
                          ({(it.options || []).map((op) => op.option_value_name || op.option_name).join(", ")})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {(o.delivery_notes || o.order_comment) && (
                  <p className="mt-2 text-xs text-gray-500">
                    <span className="font-semibold">Notes:</span> {o.delivery_notes || o.order_comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
