"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, AlertCircle, Package, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface DietaryCode {
  ellora_dietary_code_id: number
  code_name: string
  color?: string | null
}

interface ElloraOptionValue {
  ellora_option_value_id: number
  name: string
  sort_order?: number
  standard_price?: number | string
}

interface ElloraOption {
  ellora_option_id: number
  option_name: string
  option_type: "checkbox" | "radio" | "dropdown"
  values?: ElloraOptionValue[]
}

interface ElloraProduct {
  ellora_product_id: number
  ellora_category_id?: number | null
  category_name?: string | null
  product_name: string
  product_description?: string | null
  price: number | string
  image_url?: string | null
  status?: number | null
  sort_order?: number | null
  dietary_codes?: DietaryCode[]
  options?: ElloraOption[]
}

interface ElloraCategory {
  ellora_category_id: number
  category_name: string
}

export default function ElloraProductsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selected, setSelected] = useState<ElloraProduct | null>(null)

  // Form state
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [price, setPrice] = useState<string>("0")
  const [elloraCategoryId, setElloraCategoryId] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<string>("0")
  const [statusValue, setStatusValue] = useState<number>(1)
  const [dietaryCodeIds, setDietaryCodeIds] = useState<number[]>([])
  const [optionIds, setOptionIds] = useState<number[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<{ product_name?: string; price?: string }>({})

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["ellora-products"],
    queryFn: async () => {
      const response = await api.get("/admin/ellora/products")
      return response.data
    },
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["ellora-categories"],
    queryFn: async () => {
      const response = await api.get("/admin/ellora/categories")
      return response.data
    },
  })

  const { data: dietaryData } = useQuery({
    queryKey: ["ellora-dietary-codes"],
    queryFn: async () => {
      const response = await api.get("/admin/ellora/dietary-codes")
      return response.data
    },
  })

  const { data: optionsData } = useQuery({
    queryKey: ["ellora-options"],
    queryFn: async () => {
      const response = await api.get("/admin/ellora/options")
      return response.data
    },
  })

  const products: ElloraProduct[] = productsData?.products || []
  const categories: ElloraCategory[] = categoriesData?.categories || []
  const dietaryCodes: DietaryCode[] = dietaryData?.dietary_codes || []
  const availableOptions: ElloraOption[] = optionsData?.options || []

  const filtered = products.filter((p) => {
    const matchesSearch = !searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || String(p.ellora_category_id) === categoryFilter
    return matchesSearch && matchesCategory
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/ellora/products", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-products"] })
      toast.success("Product created successfully!")
      setShowAddModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/admin/ellora/products/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-products"] })
      toast.success("Product updated successfully!")
      setShowEditModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/ellora/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ellora-products"] })
      toast.success("Product deleted successfully!")
      setShowDeleteModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product")
    },
  })

  const resetForm = () => {
    setProductName("")
    setProductDescription("")
    setPrice("0")
    setElloraCategoryId("")
    setImageUrl("")
    setSortOrder("0")
    setStatusValue(1)
    setDietaryCodeIds([])
    setOptionIds([])
    setSelected(null)
    setErrors({})
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const response = await api.post("/admin/upload/product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const url = response.data?.images?.[0]?.url
      if (url) {
        setImageUrl(url)
        toast.success("Image uploaded")
      } else {
        toast.error("Upload failed")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const toggleDietaryCode = (id: number) => {
    setDietaryCodeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleOption = (id: number) => {
    setOptionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSave = () => {
    const newErrors: any = {}
    if (!productName.trim()) newErrors.product_name = "Required"
    if (price === "" || isNaN(Number(price)) || Number(price) < 0) newErrors.price = "Enter a valid price"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const payload = {
      product_name: productName,
      product_description: productDescription,
      price: Number(price),
      ellora_category_id: elloraCategoryId ? Number(elloraCategoryId) : null,
      image_url: imageUrl || null,
      sort_order: parseInt(sortOrder) || 0,
      status: statusValue,
      dietary_code_ids: dietaryCodeIds,
      option_ids: optionIds,
    }
    if (selected) {
      updateMutation.mutate({ id: selected.ellora_product_id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (product: ElloraProduct) => {
    setSelected(product)
    setProductName(product.product_name)
    setProductDescription(product.product_description || "")
    setPrice(String(product.price ?? 0))
    setElloraCategoryId(product.ellora_category_id ? String(product.ellora_category_id) : "")
    setImageUrl(product.image_url || "")
    setSortOrder(product.sort_order?.toString() || "0")
    setStatusValue(product.status ?? 1)
    setDietaryCodeIds((product.dietary_codes || []).map((d) => d.ellora_dietary_code_id))
    setOptionIds((product.options || []).map((o) => o.ellora_option_id))
    setShowEditModal(true)
  }

  const handleDelete = (product: ElloraProduct) => {
    setSelected(product)
    setShowDeleteModal(true)
  }

  const formatPrice = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Illoura Products</h1>
          <p className="text-gray-500 mt-1">Manage products for the Illoura staff ordering portal.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[#243F2A] hover:bg-[#1A2E1E] text-white flex items-center gap-2 px-6 h-12 rounded-full font-semibold"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <Link href="/admin/ellora/categories">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Categories
          </button>
        </Link>
        <button className="px-6 py-2 rounded-full text-sm font-semibold bg-[#EAF0EC] text-[#243F2A]">
          Products
        </button>
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

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-full border border-gray-200 bg-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-14 rounded-full border border-gray-200 bg-white px-6 outline-none text-gray-600"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.ellora_category_id} value={c.ellora_category_id}>{c.category_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Dietary</th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading products...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No products found.</td></tr>
            ) : filtered.map((product) => (
              <tr key={product.ellora_product_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                      {product.product_description && (
                        <div className="text-xs text-gray-400 max-w-[260px] truncate">{product.product_description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-gray-500">{product.category_name || "-"}</td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1">
                    {(product.dietary_codes || []).map((d) => (
                      <span
                        key={d.ellora_dietary_code_id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: d.color || "#6b7280" }}
                      >
                        {d.code_name}
                      </span>
                    ))}
                    {(!product.dietary_codes || product.dietary_codes.length === 0) && <span className="text-gray-300">-</span>}
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-medium text-gray-900">${formatPrice(product.price)}</td>
                <td className="px-6 py-5 text-sm">
                  {product.status === 1 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(product)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(product)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => { if (!open) { resetForm(); setShowAddModal(false); setShowEditModal(false); } }}>
        <DialogContent className="max-w-lg bg-white p-8 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-[#243F2A]" />
              {showEditModal ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Product Name</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Egg & Bacon Roll"
                className="h-12 border-gray-200"
              />
              {errors.product_name && <p className="text-xs text-red-600">{errors.product_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Category</Label>
                <select
                  value={elloraCategoryId}
                  onChange={(e) => setElloraCategoryId(e.target.value)}
                  className="w-full h-12 rounded-lg border border-gray-200 px-4 outline-none"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.ellora_category_id} value={c.ellora_category_id}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="h-12 border-gray-200"
                />
                {errors.price && <p className="text-xs text-red-600">{errors.price}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Description</Label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Short description shown on the menu"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Dietary Codes</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryCodes.length === 0 && <p className="text-xs text-gray-400">No dietary codes yet. Add some first.</p>}
                {dietaryCodes.map((d) => {
                  const active = dietaryCodeIds.includes(d.ellora_dietary_code_id)
                  return (
                    <button
                      key={d.ellora_dietary_code_id}
                      type="button"
                      onClick={() => toggleDietaryCode(d.ellora_dietary_code_id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${active ? "text-white" : "text-gray-600 bg-white"}`}
                      style={active ? { backgroundColor: d.color || "#243F2A", borderColor: d.color || "#243F2A" } : { borderColor: "#e5e7eb" }}
                    >
                      {d.code_name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Options</Label>
              <p className="text-xs text-gray-400">Select add-ons customers can choose for this product.</p>
              <div className="flex flex-wrap gap-2">
                {availableOptions.length === 0 && <p className="text-xs text-gray-400">No options yet. Create some on the Options tab first.</p>}
                {availableOptions.map((o) => {
                  const active = optionIds.includes(o.ellora_option_id)
                  const valueCount = (o.values || []).length
                  return (
                    <button
                      key={o.ellora_option_id}
                      type="button"
                      onClick={() => toggleOption(o.ellora_option_id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${active ? "bg-[#243F2A] border-[#243F2A] text-white" : "text-gray-600 bg-white border-gray-200"}`}
                    >
                      {o.option_name}
                      {valueCount > 0 ? ` · ${valueCount} value${valueCount === 1 ? "" : "s"}` : ""}
                      <span className={`ml-1.5 text-[10px] ${active ? "text-white/70" : "text-gray-400"}`}>({o.option_type})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Product Image</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-10 rounded-lg"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {uploading ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
                  </Button>
                  {imageUrl && (
                    <button type="button" onClick={() => setImageUrl("")} className="ml-3 text-xs text-red-600 hover:underline">Remove</button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  value={statusValue}
                  onChange={(e) => setStatusValue(Number(e.target.value))}
                  className="w-full h-12 rounded-lg border border-gray-200 px-4 outline-none"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
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
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Delete Product?</DialogTitle>
            <p className="text-gray-500 mb-8">This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 rounded-xl">Keep it</Button>
              <Button onClick={() => selected && deleteMutation.mutate(selected.ellora_product_id)} disabled={deleteMutation.isPending} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
