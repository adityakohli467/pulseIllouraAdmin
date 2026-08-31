"use client"

import { Suspense, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"

interface LabelItem {
  name: string
  quantity: number
  category_name: string
  options: string[]
  dietary_codes: string[]
}

interface LabelCategory {
  category_name: string
  items: LabelItem[]
}

interface OrderLabel {
  order_id: number
  venue_name: string
  room: string
  customer_name: string
  delivery_date_time: string
  dietary: string
  categories: LabelCategory[]
}

interface LabelsResponse {
  scope: string
  total_orders: number
  labels: OrderLabel[]
}

const formatDate = (iso: string) => {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function LabelCard({ label, index }: { label: OrderLabel; index: number }) {
  const bandTitle = label.categories[0]?.category_name || "Order"
  return (
    <div className="break-inside-avoid border border-gray-300 rounded-sm bg-white text-black overflow-hidden">
      {/* Venue header */}
      <div className="text-center py-1.5 border-b border-gray-200">
        <p className="text-[13px] font-semibold">☕ {label.venue_name}</p>
        <p className="text-[10px] text-gray-500">Label {index + 1}</p>
      </div>

      {/* Meal / category accent band */}
      <div className="bg-[#F5A623] text-black text-[10px] font-bold uppercase tracking-wide px-3 py-1">
        {bandTitle}
      </div>

      {/* Room band */}
      <div className="bg-black text-white text-center px-3 py-3">
        <p className="text-lg font-bold leading-tight">{label.room || "—"}</p>
      </div>

      {/* Details */}
      <div className="px-3 py-2 text-[11px] space-y-1 border-b border-dashed border-gray-300">
        <p>
          <span className="font-bold">Patient:</span> {label.customer_name || "-"}
        </p>
        <p>
          <span className="font-bold">Date:</span> {formatDate(label.delivery_date_time)}
        </p>
        <p>
          <span className="font-bold">🍽 Dietary:</span> {label.dietary}
        </p>
      </div>

      {/* Food items grouped by category */}
      <div className="px-3 py-2">
        <p className="text-[11px] font-bold mb-1">Food Items:</p>
        <div className="space-y-2">
          {label.categories.map((cat) => (
            <div key={cat.category_name}>
              <p className="text-[11px] font-bold">{cat.category_name}</p>
              {cat.items.map((it, i) => (
                <div key={`${it.name}:${i}`} className="pl-0.5">
                  <p className="text-[11px]">
                    {it.quantity > 1 ? `${it.quantity}× ` : ""}
                    {it.name}
                    {it.options.length > 0 ? ` (${it.options.join(", ")})` : ""}
                  </p>
                  {it.dietary_codes.length > 0 && (
                    <p className="text-[10px] font-semibold bg-[#FFF3CD] text-[#8a6d00] inline-block px-1 rounded">
                      ⚠ Dietary: {it.dietary_codes.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
          {label.categories.length === 0 && (
            <p className="text-[11px] text-gray-400">No items</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-1.5 border-t border-gray-200">
        <p className="text-[10px] text-gray-500">Thank you for choosing {label.venue_name}</p>
      </div>
    </div>
  )
}

function LabelsContent() {
  const searchParams = useSearchParams()
  const date = searchParams.get("date") || undefined
  const printedRef = useRef(false)

  const { data, isLoading } = useQuery<LabelsResponse>({
    queryKey: ["cafe-order-labels", date],
    queryFn: async () => {
      const params = date ? { date } : {}
      const res = await api.get("/admin/cafe/orders/labels", { params })
      return res.data
    },
  })

  // Auto-open the print dialog once labels have loaded.
  useEffect(() => {
    if (!printedRef.current && data && data.labels.length > 0) {
      printedRef.current = true
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [data])

  return (
    <div className="bg-gray-100 min-h-screen p-6 print:bg-white print:p-0" style={{ fontFamily: "Albert Sans" }}>
      <div className="max-w-5xl mx-auto">
        {/* Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <div>
            <Link href="/admin/cafe/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Order Labels</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${data.total_orders} label${data.total_orders === 1 ? "" : "s"}` : "Loading…"}
            </p>
          </div>
          <Button
            onClick={() => window.print()}
            className="flex items-center gap-2 h-11 px-5 rounded-lg bg-[#243F2A] hover:bg-[#1A2E1E] text-white"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading labels…</div>
        ) : !data || data.labels.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No orders to print for today.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            {data.labels.map((label, i) => (
              <LabelCard key={label.order_id} label={label} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderLabelsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading…</div>}>
      <LabelsContent />
    </Suspense>
  )
}
