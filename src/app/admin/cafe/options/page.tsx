"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, AlertCircle, SlidersHorizontal, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type OptionType = "checkbox" | "radio" | "dropdown"

interface CafeOptionValue {
  cafe_option_value_id?: number
  name: string
  sort_order: number
  standard_price?: number | string
}

interface CafeOption {
  cafe_option_id: number
  option_name: string
  option_type: OptionType
  sort_order?: number | null
  status?: number | null
  values: CafeOptionValue[]
}

const OPTION_TYPE_LABELS: Record<OptionType, string> = {
  checkbox: "Checkbox",
  radio: "Radio",
  dropdown: "Dropdown",
}

const OPTION_TYPE_HINTS: Record<OptionType, string> = {
  checkbox: "Multiple select — customer can tick any of the values.",
  radio: "Single select buttons — customer picks one value.",
  dropdown: "Single select dropdown — customer picks one value.",
}

export default function CafeOptionsPage() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selected, setSelected] = useState<CafeOption | null>(null)

  const [optionName, setOptionName] = useState("")
  const [optionType, setOptionType] = useState<OptionType>("checkbox")
  const [sortOrder, setSortOrder] = useState<string>("0")
  const [status, setStatus] = useState<number>(1)
  const [optionValues, setOptionValues] = useState<CafeOptionValue[]>([
    { name: "", sort_order: 1, standard_price: 0 },
  ])
  const [errors, setErrors] = useState<{ option_name?: string; option_values?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ["cafe-options"],
    queryFn: async () => {
      const response = await api.get("/admin/cafe/options")
      return response.data
    },
  })

  const options: CafeOption[] = data?.options || []

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/cafe/options", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe-options"] })
      toast.success("Option created successfully!")
      setShowAddModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create option")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => api.put(`/admin/cafe/options/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe-options"] })
      toast.success("Option updated successfully!")
      setShowEditModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update option")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/cafe/options/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafe-options"] })
      toast.success("Option deleted successfully!")
      setShowDeleteModal(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete option")
    },
  })

  const resetForm = () => {
    setOptionName("")
    setOptionType("checkbox")
    setSortOrder("0")
    setStatus(1)
    setOptionValues([{ name: "", sort_order: 1, standard_price: 0 }])
    setSelected(null)
    setErrors({})
  }

  const addValueField = () => {
    setOptionValues([...optionValues, { name: "", sort_order: optionValues.length + 1, standard_price: 0 }])
  }

  const removeValueField = (index: number) => {
    if (optionValues.length > 1) {
      const newValues = optionValues.filter((_, i) => i !== index)
      newValues.forEach((v, i) => (v.sort_order = i + 1))
      setOptionValues(newValues)
    }
  }

  const handleSave = () => {
    const newErrors: typeof errors = {}
    if (!optionName.trim()) newErrors.option_name = "Option name is required"

    const validValues = optionValues.filter((v) => v.name.trim())
    if (validValues.length === 0) {
      newErrors.option_values = "At least one option value is required"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0]
      if (firstError) toast.error(firstError)
      return
    }

    const payload = {
      option_name: optionName.trim(),
      option_type: optionType,
      sort_order: parseInt(sortOrder) || 0,
      status,
      values: validValues.map((v, i) => ({
        ...(v.cafe_option_value_id ? { cafe_option_value_id: v.cafe_option_value_id } : {}),
        name: v.name.trim(),
        sort_order: v.sort_order ?? i + 1,
        standard_price: Number(v.standard_price || 0),
      })),
    }

    if (selected) {
      updateMutation.mutate({ id: selected.cafe_option_id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (option: CafeOption) => {
    setSelected(option)
    setOptionName(option.option_name)
    setOptionType(option.option_type)
    setSortOrder(option.sort_order?.toString() || "0")
    setStatus(option.status ?? 1)
    setOptionValues(
      option.values && option.values.length > 0
        ? option.values.map((v, i) => ({
            cafe_option_value_id: v.cafe_option_value_id,
            name: v.name,
            sort_order: v.sort_order ?? i + 1,
            standard_price: v.standard_price ?? 0,
          }))
        : [{ name: "", sort_order: 1, standard_price: 0 }],
    )
    setShowEditModal(true)
  }

  const handleDelete = (option: CafeOption) => {
    setSelected(option)
    setShowDeleteModal(true)
  }

  const formatPrice = (value: number | string | null | undefined) => {
    const num = typeof value === "string" ? parseFloat(value) : value || 0
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8" style={{ fontFamily: "Albert Sans" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Options</h1>
          <p className="text-gray-500 mt-1">Manage add-ons and modifiers that can be assigned to products.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[#243F2A] hover:bg-[#1A2E1E] text-white flex items-center gap-2 px-6 h-12 rounded-full font-semibold"
        >
          <Plus className="h-5 w-5" />
          Add Option
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <Link href="/admin/cafe/categories">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Categories
          </button>
        </Link>
        <Link href="/admin/cafe/products">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Products
          </button>
        </Link>
        <Link href="/admin/cafe/dietary-codes">
          <button className="px-6 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">
            Dietary Codes
          </button>
        </Link>
        <button className="px-6 py-2 rounded-full text-sm font-semibold bg-[#EAF0EC] text-[#243F2A]">
          Options
        </button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden bg-white rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Option</th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading options...</td></tr>
              ) : options.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No options found.</td></tr>
              ) : (
                options.map((option) => {
                  const values = option.values && option.values.length > 0 ? option.values : [{ name: "-", sort_order: 0, standard_price: 0 }]
                  return values.map((value, valueIndex) => (
                    <tr key={`${option.cafe_option_id}-${valueIndex}`} className="hover:bg-gray-50/50 transition-colors">
                      {valueIndex === 0 ? (
                        <>
                          <td className="px-6 py-5 text-sm font-medium text-gray-900" rowSpan={values.length}>
                            {option.option_name}
                          </td>
                          <td className="px-6 py-5" rowSpan={values.length}>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF0EC] text-[#243F2A]">
                              {OPTION_TYPE_LABELS[option.option_type] || option.option_type}
                            </span>
                          </td>
                        </>
                      ) : null}
                      <td className="px-6 py-5 text-sm text-gray-700">{value.name}</td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-900">+${formatPrice(value.standard_price)}</td>
                      {valueIndex === 0 ? (
                        <>
                          <td className="px-6 py-5 text-sm" rowSpan={values.length}>
                            {option.status === 1 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                            )}
                          </td>
                          <td className="px-6 py-5" rowSpan={values.length}>
                            <div className="flex gap-3">
                              <button onClick={() => handleEdit(option)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDelete(option)} className="p-2 text-[#243F2A] hover:bg-[#EAF0EC] rounded-lg"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </>
                      ) : null}
                    </tr>
                  ))
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || showEditModal} onOpenChange={(open) => { if (!open) { resetForm(); setShowAddModal(false); setShowEditModal(false); } }}>
        <DialogContent className="max-w-2xl bg-white p-8 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#243F2A]" />
              {showEditModal ? "Edit Option" : "Add Option"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Option Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                placeholder="e.g. Size, Extras, Sauce"
                className="h-12 border-gray-200"
              />
              {errors.option_name && <p className="text-xs text-red-600">{errors.option_name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Option Type</Label>
              <select
                value={optionType}
                onChange={(e) => setOptionType(e.target.value as OptionType)}
                className="w-full h-12 rounded-lg border border-gray-200 px-4 outline-none"
              >
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
                <option value="dropdown">Dropdown</option>
              </select>
              <p className="text-xs text-gray-400">{OPTION_TYPE_HINTS[optionType]}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700">
                  Option Values <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  onClick={addValueField}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Value
                </Button>
              </div>

              <div className="space-y-3">
                {optionValues.map((value, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder={`Value ${index + 1} (e.g., Small, Medium, Large)`}
                        value={value.name}
                        onChange={(e) => {
                          const newValues = [...optionValues]
                          newValues[index].name = e.target.value
                          setOptionValues(newValues)
                        }}
                        className="h-10 border-gray-300 bg-white flex-1"
                      />
                      {optionValues.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeValueField(index)}
                          size="sm"
                          variant="outline"
                          className="text-[#243F2A] hover:text-[#243F2A] hover:bg-[#EAF0EC]"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Standard Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={value.standard_price}
                        onChange={(e) => {
                          const newValues = [...optionValues]
                          const val = e.target.value
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            newValues[index].standard_price = val
                            setOptionValues(newValues)
                          }
                        }}
                        className="h-8 text-sm border-gray-300 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {errors.option_values && <p className="text-xs text-red-600">{errors.option_values}</p>}
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
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
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
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : showEditModal ? "Update" : "Create"}
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
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Delete Option?</DialogTitle>
            <p className="text-gray-500 mb-8">This action cannot be undone. It will be removed from all products it is attached to.</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 rounded-xl">Keep it</Button>
              <Button onClick={() => selected && deleteMutation.mutate(selected.cafe_option_id)} disabled={deleteMutation.isPending} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
