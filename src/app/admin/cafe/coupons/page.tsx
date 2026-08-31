"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, AlertCircle, Tag } from "lucide-react"
import { toast } from "sonner"

interface CafeCoupon {
  coupon_id: number
  coupon_code: string
  coupon_description: string
  coupon_discount: number | string
  type: "P" | "F"
  status?: number | null
}

export default function CafeCouponsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selected, setSelected] = useState<CafeCoupon | null>(null)

  // Form state
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [discount, setDiscount] = useState<string>("0")
  const [type, setType] = useState<"P" | "F">("P")
  const [status, setStatus] = useState<number>(1)
  const [errors, setErrors] = useState<{ code?: string; discount?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ["cafe-coupons"],
    queryFn: async () => {
      const response = await api.get("/admin/cafe/coupons")
      return response.data
    },
  })

  const coupons: CafeCoupon[] = data?.coupons || []

  const filtered = coupons.filter(
    (c) =>
      !searchQuery ||
      c.coupon_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.coupon_description || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/cafe/coupons", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe-coupons"] })
      toast.success("Coupon created successfully!")
      setShowAddModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create coupon")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/admin/cafe/coupons/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe-coupons"] })
      toast.success("Coupon updated successfully!")
      setShowEditModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update coupon")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/cafe/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe-coupons"] })
      toast.success("Coupon deleted successfully!")
      setShowDeleteModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete coupon")
    },
  })

  const resetForm = () => {
    setCode("")
    setDescription("")
    setDiscount("0")
    setType("P")
    setStatus(1)
    setSelected(null)
    setErrors({})
  }

  const handleSave = () => {
    const newErrors: typeof errors = {}
    if (!code.trim()) newErrors.code = "Required"
    const discountNum = parseFloat(discount)
    if (!Number.isFinite(discountNum) || discountNum < 0) newErrors.discount = "Enter a valid amount"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const payload = {
      coupon_code: code.trim(),
      coupon_description: description.trim(),
      coupon_discount: discountNum,
      type,
      status,
    }
    if (selected) {
      updateMutation.mutate({ id: selected.coupon_id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (coupon: CafeCoupon) => {
    setSelected(coupon)
    setCode(coupon.coupon_code)
    setDescription(coupon.coupon_description || "")
    setDiscount(String(coupon.coupon_discount ?? "0"))
    setType(coupon.type === "F" ? "F" : "P")
    setStatus(coupon.status ?? 1)
    setShowEditModal(true)
  }

  const handleDelete = (coupon: CafeCoupon) => {
    setSelected(coupon)
    setShowDeleteModal(true)
  }

  const formatDiscount = (c: CafeCoupon) =>
    c.type === "F"
      ? `$${Number(c.coupon_discount || 0).toFixed(2)}`
      : `${Number(c.coupon_discount || 0)}%`

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Cafe Coupons</h1>
          <p className="text-gray-500 mt-1">Discount codes for the Cafe staff ordering portal.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[#243F2A] hover:bg-[#1A2E1E] text-white flex items-center gap-2 px-6 h-12 rounded-full font-semibold"
        >
          <Plus className="h-5 w-5" />
          Add Coupon
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative w-[500px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search coupons..."
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
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading coupons...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No coupons found.</td></tr>
            ) : filtered.map((coupon) => (
              <tr key={coupon.coupon_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 text-sm font-semibold text-gray-900 uppercase">{coupon.coupon_code}</td>
                <td className="px-8 py-5 text-sm text-gray-500">{coupon.coupon_description || "-"}</td>
                <td className="px-8 py-5 text-sm text-gray-900">{formatDiscount(coupon)}</td>
                <td className="px-8 py-5 text-sm">
                  {coupon.status === 1 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(coupon)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(coupon)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => { if (!open) { resetForm(); setShowAddModal(false); setShowEditModal(false); } }}>
        <DialogContent className="max-w-md bg-white p-8 rounded-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#243F2A]" />
              {showEditModal ? "Edit Coupon" : "Add Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Coupon Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. STAFF10"
                className="h-12 border-gray-200 uppercase"
              />
              {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 10% off staff orders"
                className="h-12 border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Type</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value === "F" ? "F" : "P")}
                  className="w-full h-12 rounded-lg border border-gray-200 px-4 outline-none"
                >
                  <option value="P">Percentage (%)</option>
                  <option value="F">Fixed ($)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">{type === "F" ? "Amount ($)" : "Discount (%)"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="h-12 border-gray-200"
                />
                {errors.discount && <p className="text-xs text-red-600">{errors.discount}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full h-12 rounded-lg border border-gray-200 px-4 outline-none"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="flex-1 h-12 rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-12 rounded-xl bg-[#243F2A] hover:bg-[#1A2E1E] text-white font-semibold">
                {showEditModal ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md bg-white p-8 rounded-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Delete Coupon?</DialogTitle>
            <p className="text-gray-500 mb-8">This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 rounded-xl">Keep it</Button>
              <Button onClick={() => selected && deleteMutation.mutate(selected.coupon_id)} disabled={deleteMutation.isPending} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
