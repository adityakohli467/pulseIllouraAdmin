"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, AlertCircle, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface ElloraCategory {
  ellora_category_id: number
  category_name: string
  sort_order?: number | null
  status?: number | null
}

export default function ElloraCategoriesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selected, setSelected] = useState<ElloraCategory | null>(null)

  // Form state
  const [categoryName, setCategoryName] = useState("")
  const [sortOrder, setSortOrder] = useState<string>("0")
  const [status, setStatus] = useState<number>(1)
  const [errors, setErrors] = useState<{ category_name?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ["ellora-categories"],
    queryFn: async () => {
      const response = await api.get("/admin/ellora/categories")
      return response.data
    },
  })

  const categories: ElloraCategory[] = data?.categories || []

  const filtered = categories.filter(
    (c) => !searchQuery || c.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/ellora/categories", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-categories"] })
      toast.success("Category created successfully!")
      setShowAddModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/admin/ellora/categories/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-categories"] })
      toast.success("Category updated successfully!")
      setShowEditModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update category")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/ellora/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-categories"] })
      toast.success("Category deleted successfully!")
      setShowDeleteModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete category")
    },
  })

  const resetForm = () => {
    setCategoryName("")
    setSortOrder("0")
    setStatus(1)
    setSelected(null)
    setErrors({})
  }

  const handleSave = () => {
    const newErrors: any = {}
    if (!categoryName.trim()) newErrors.category_name = "Required"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const payload = {
      category_name: categoryName,
      sort_order: parseInt(sortOrder) || 0,
      status,
    }
    if (selected) {
      updateMutation.mutate({ id: selected.ellora_category_id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (category: ElloraCategory) => {
    setSelected(category)
    setCategoryName(category.category_name)
    setSortOrder(category.sort_order?.toString() || "0")
    setStatus(category.status ?? 1)
    setShowEditModal(true)
  }

  const handleDelete = (category: ElloraCategory) => {
    setSelected(category)
    setShowDeleteModal(true)
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Illoura Categories</h1>
          <p className="text-gray-500 mt-1">Manage menu categories for the Illoura staff ordering portal.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[#243F2A] hover:bg-[#1A2E1E] text-white flex items-center gap-2 px-6 h-12 rounded-full font-semibold"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button className="px-6 py-2 rounded-full text-sm font-semibold bg-[#EAF0EC] text-[#243F2A]">
          Categories
        </button>
        <Link href="/admin/ellora/products">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Products
          </button>
        </Link>
        <Link href="/admin/ellora/dietary-codes">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Dietary Codes
          </button>
        </Link>
        <Link href="/admin/ellora/options">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Options
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative w-[500px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search categories..."
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
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Sort Order</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading categories...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">No categories found.</td></tr>
            ) : filtered.map((category) => (
              <tr key={category.ellora_category_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 text-sm font-medium text-gray-900 uppercase">{category.category_name}</td>
                <td className="px-8 py-5 text-sm text-gray-500">{category.sort_order ?? 0}</td>
                <td className="px-8 py-5 text-sm">
                  {category.status === 1 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(category)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(category)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Trash2 className="h-4 w-4" /></button>
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
              <FolderOpen className="h-5 w-5 text-[#243F2A]" />
              {showEditModal ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Category Name</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Breakfast"
                className="h-12 border-gray-200"
              />
              {errors.category_name && <p className="text-xs text-red-600">{errors.category_name}</p>}
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
              <p className="text-xs text-gray-500">Lower numbers appear first on the menu.</p>
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
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Delete Category?</DialogTitle>
            <p className="text-gray-500 mb-8">This action cannot be undone. Products in this category will be left without a category.</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 rounded-xl">Keep it</Button>
              <Button onClick={() => selected && deleteMutation.mutate(selected.ellora_category_id)} disabled={deleteMutation.isPending} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
