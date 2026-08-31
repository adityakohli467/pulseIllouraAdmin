"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"

interface CafeCustomer {
  customer_name: string | null
  email: string | null
  telephone: string | null
  order_count: number
  total_spent: number | string
  last_order_date: string | null
}

const money = (v: number | string) =>
  `$${Number(v || 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso: string | null) => {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

export default function CafeCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["cafe-customers"],
    queryFn: async () => {
      const response = await api.get("/admin/cafe/customers")
      return response.data
    },
  })

  const customers: CafeCustomer[] = data?.customers || []

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.customer_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.telephone || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Cafe Customers</h1>
          <p className="text-gray-500 mt-1">Staff who have placed Cafe orders.</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative w-[500px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-full border border-gray-200 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading customers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  No customers found.
                </td>
              </tr>
            ) : filtered.map((c, idx) => (
              <tr key={`${c.email || c.customer_name || "row"}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 text-sm font-medium text-gray-900">{c.customer_name || "-"}</td>
                <td className="px-8 py-5 text-sm text-gray-500">{c.email || "-"}</td>
                <td className="px-8 py-5 text-sm text-gray-500">{c.telephone || "-"}</td>
                <td className="px-8 py-5 text-sm text-gray-900">{c.order_count}</td>
                <td className="px-8 py-5 text-sm font-semibold text-gray-900">{money(c.total_spent)}</td>
                <td className="px-8 py-5 text-sm text-gray-500">{formatDate(c.last_order_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
