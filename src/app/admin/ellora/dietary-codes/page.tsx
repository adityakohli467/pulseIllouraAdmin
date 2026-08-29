"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, AlertCircle, Tag } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface DietaryCode {
  ellora_dietary_code_id: number
  code_name: string
  color?: string | null
  sort_order?: number | null
  status?: number | null
}

const COLOR_PRESETS = [
  "#16a34a", // green
  "#ea580c", // orange
  "#2563eb", // blue
  "#7c3aed", // purple
  "#dc2626", // red
  "#0891b2", // cyan
  "#ca8a04", // amber
]

export default function ElloraDietaryCodesPage() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selected, setSelected] = useState<DietaryCode | null>(null)

  const [codeName, setCodeName] = useState("")
  const [color, setColor] = useState<string>("#16a34a")
  const [sortOrder, setSortOrder] = useState<string>("0")
  const [status, setStatus] = useState<number>(1)
  const [errors, setErrors] = useState<{ code_name?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ["ellora-dietary-codes"],
    queryFn: async () => {
      const response = await api.get("/admin/ellora/dietary-codes")
      return response.data
    },
  })

  const codes: DietaryCode[] = data?.dietary_codes || []

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/ellora/dietary-codes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-dietary-codes"] })
      toast.success("Dietary code created successfully!")
      setShowAddModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create dietary code")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/admin/ellora/dietary-codes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-dietary-codes"] })
      toast.success("Dietary code updated successfully!")
      setShowEditModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update dietary code")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/ellora/dietary-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-dietary-codes"] })
      toast.success("Dietary code deleted successfully!")
      setShowDeleteModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete dietary code")
    },
  })

  const resetForm = () => {
    setCodeName("")
    setColor("#16a34a")
    setSortOrder("0")
    setStatus(1)
    setSelected(null)
    setErrors({})
  }

  const handleSave = () => {
    const newErrors: any = {}
    if (!codeName.trim()) newErrors.code_name = "Required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const payload = {
      code_name: codeName,
      color,
      sort_order: parseInt(sortOrder) || 0,
      status,
    }
    if (selected) {
      updateMutation.mutate({ id: selected.ellora_dietary_code_id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (code: DietaryCode) => {
    setSelected(code)
    setCodeName(code.code_name)
    setColor(code.color || "#16a34a")
    setSortOrder(code.sort_order?.toString() || "0")
    setStatus(code.status ?? 1)
    setShowEditModal(true)
  }

  const handleDelete = (code: DietaryCode) => {
    setSelected(code)
    setShowDeleteModal(true)
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dietary Codes</h1>
          <p className="text-gray-500 mt-1">Manage dietary labels (Vegetarian, Vegan, Gluten Free...) shown against products.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[#243F2A] hover:bg-[#1A2E1E] text-white flex items-center gap-2 px-6 h-12 rounded-full font-semibold"
        >
          <Plus className="h-5 w-5" />
          Add Dietary Code
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <Link href="/admin/ellora/categories">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Categories
          </button>
        </Link>
        <Link href="/admin/ellora/products">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Products
          </button>
        </Link>
        <button className="px-6 py-2 rounded-full text-sm font-semibold bg-[#EAF0EC] text-[#243F2A]">
          Dietary Codes
        </button>
        <Link href="/admin/ellora/options">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Options
          </button>
        </Link>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Preview</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Sort Order</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading dietary codes...</td></tr>
            ) : codes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No dietary codes found.</td></tr>
            ) : codes.map((code) => (
              <tr key={code.ellora_dietary_code_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 text-sm font-medium text-gray-900">{code.code_name}</td>
                <td className="px-8 py-5">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: code.color || "#6b7280" }}
                  >
                    {code.code_name}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-gray-500">{code.sort_order ?? 0}</td>
                <td className="px-8 py-5 text-sm">
                  {code.status === 1 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(code)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(code)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Trash2 className="h-4 w-4" /></button>
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
              {showEditModal ? "Edit Dietary Code" : "Add Dietary Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Code Name</Label>
              <Input
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                placeholder="e.g. Vegetarian"
                className="h-12 border-gray-200"
              />
              {errors.code_name && <p className="text-xs text-red-600">{errors.code_name}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-12 w-14 rounded-lg border border-gray-200 cursor-pointer"
                />
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={`h-7 w-7 rounded-full border-2 ${color.toLowerCase() === preset.toLowerCase() ? "border-gray-900" : "border-transparent"}`}
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Sort Order</Label>
              <Input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                className="h-12 border-gray-200"
              />
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
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Delete Dietary Code?</DialogTitle>
            <p className="text-gray-500 mb-8">This action cannot be undone. It will be removed from all products it is attached to.</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 rounded-xl">Keep it</Button>
              <Button onClick={() => selected && deleteMutation.mutate(selected.ellora_dietary_code_id)} disabled={deleteMutation.isPending} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
