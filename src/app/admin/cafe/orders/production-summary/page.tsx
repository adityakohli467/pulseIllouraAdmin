"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Check, RefreshCw } from "lucide-react"

interface ProductionItem {
  name: string
  quantity: number
  dietary_codes: string[]
}

interface ProductionGroup {
  group_name: string
  items: ProductionItem[]
}

interface ProductionCategoryGroup {
  category_name: string
  items: ProductionItem[]
}

interface ProductionSummary {
  scope: string
  total_orders: number
  products: ProductionItem[]
  product_groups?: ProductionCategoryGroup[]
  groups: ProductionGroup[]
}

const scopeLabel = (scope: string) => {
  if (scope === "all") return "All dates"
  const d = new Date(`${scope}T00:00:00`)
  if (isNaN(d.getTime())) return scope
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function ItemRow({
  item,
  itemKey,
  done,
  onToggle,
}: {
  item: ProductionItem
  itemKey: string
  done: boolean
  onToggle: (key: string) => void
}) {
  return (
    <div className={`flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 ${done ? "bg-gray-50" : "bg-white"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${done ? "bg-gray-300" : "bg-teal-500"}`} />
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(itemKey)}
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 print:hidden"
        />
        <span className={`font-semibold text-gray-900 truncate ${done ? "line-through text-gray-400" : ""}`}>
          {item.name}
        </span>
        {item.dietary_codes?.map((code) => (
          <span key={code} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 whitespace-nowrap">
            {code}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="min-w-[40px] text-center text-sm font-semibold text-gray-800 bg-[#f5efe3] rounded-md px-3 py-1">
          {item.quantity}
        </span>
        <button
          onClick={() => onToggle(itemKey)}
          className={`print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ${done ? "bg-gray-400 hover:bg-gray-500" : "bg-teal-600 hover:bg-teal-700"}`}
        >
          <Check className="h-4 w-4" />
          {done ? "Completed" : "Mark Complete"}
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  items,
  keyPrefix,
  completed,
  onToggle,
}: {
  title: string
  items: ProductionItem[]
  keyPrefix: string
  completed: Record<string, boolean>
  onToggle: (key: string) => void
}) {
  if (!items.length) return null
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span className="h-5 w-1 rounded bg-teal-500" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <span className="flex-1 border-t border-teal-100" />
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const key = `${keyPrefix}:${item.name}:${i}`
          return (
            <ItemRow key={key} item={item} itemKey={key} done={!!completed[key]} onToggle={onToggle} />
          )
        })}
      </div>
    </div>
  )
}

function ProductionSummaryContent() {
  const searchParams = useSearchParams()
  const date = searchParams.get("date") || undefined
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))

  const { data, isLoading, isFetching, refetch } = useQuery<ProductionSummary>({
    queryKey: ["cafe-production-summary", date],
    queryFn: async () => {
      const params = date ? { date } : {}
      const res = await api.get("/admin/cafe/orders/production-summary", { params })
      return res.data
    },
  })

  // Prefer the category-wise grouping from the API; fall back to a single
  // "Products" section if an older API response is returned.
  const productCategoryGroups: ProductionCategoryGroup[] =
    data?.product_groups && data.product_groups.length > 0
      ? data.product_groups
      : data
        ? [{ category_name: "Products", items: data.products }]
        : []

  const hasContent =
    !!data &&
    (productCategoryGroups.some((g) => g.items.length > 0) ||
      data.groups.some((g) => g.items.length > 0))

  return (
    <div className="bg-gray-50 min-h-screen p-6 print:bg-white print:p-0" style={{ fontFamily: "Albert Sans" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <Link href="/admin/cafe/orders" className="print:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Production Summary</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${scopeLabel(data.scope)} · ${data.total_orders} order${data.total_orders === 1 ? "" : "s"}` : "Loading…"}
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
              className="flex items-center gap-2 h-11 px-5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading production summary…</div>
        ) : !hasContent ? (
          <div className="text-center py-16 text-gray-400">No items to prepare for this scope.</div>
        ) : (
          <div>
            {productCategoryGroups.map((group) => (
              <Section
                key={`category:${group.category_name}`}
                title={group.category_name}
                items={group.items}
                keyPrefix={`category:${group.category_name}`}
                completed={completed}
                onToggle={toggle}
              />
            ))}
            {data!.groups.map((group) => (
              <Section
                key={group.group_name}
                title={group.group_name}
                items={group.items}
                keyPrefix={`group:${group.group_name}`}
                completed={completed}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductionSummaryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading…</div>}>
      <ProductionSummaryContent />
    </Suspense>
  )
}
