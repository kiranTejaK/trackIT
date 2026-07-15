import { useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { budgetsApi } from "@/api/budgets"
import { EXPENSE_CATEGORIES } from "@/api/transactions"

export default function BudgetFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [category, setCategory] = useState("")
  const [monthlyLimit, setMonthlyLimit] = useState("")

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const categoryId = useId()
  const limitId = useId()
  const monthId = useId()
  const yearId = useId()

  const addToast = (
    message: string,
    toastType: "success" | "error" | "info",
  ) => {
    window.dispatchEvent(
      new CustomEvent("app-toast", { detail: { message, type: toastType } }),
    )
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const amt = parseFloat(monthlyLimit)
    if (!monthlyLimit || Number.isNaN(amt) || amt <= 0)
      errs.monthlyLimit = "Limit must be greater than 0"
    if (!category) errs.category = "Category is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const payload = {
      category,
      monthly_limit: parseFloat(monthlyLimit),
      month,
      year,
    }

    try {
      await budgetsApi.create(payload)
      addToast("Budget created successfully.", "success")
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })
      setTimeout(() => navigate("/"), 1500)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const detail =
        axiosErr?.response?.data?.detail ||
        "Failed to create budget. A budget for this category and month might already exist."
      addToast(detail, "error")
    } finally {
      setSubmitting(false)
    }
  }

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header d-flex align-items-center gap-3">
        <Link to="/" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left" />
        </Link>
        <div>
          <h1>Create Budget</h1>
          <p>Set a monthly spending limit for a specific category</p>
        </div>
      </div>

      <div className="form-card shadow-sm mx-auto">
        <form onSubmit={handleSubmit} noValidate>
          {/* Category */}
          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor={categoryId}>
              Expense Category <span className="text-danger">*</span>
            </label>
            <select
              id={categoryId}
              className={`form-select ${errors.category ? "is-invalid" : ""}`}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                if (errors.category)
                  setErrors((prev) => ({ ...prev, category: "" }))
              }}
            >
              <option value="">Select an expense category…</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <div className="invalid-feedback">{errors.category}</div>
            )}
          </div>

          {/* Monthly Limit */}
          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor={limitId}>
              Monthly Limit <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                id={limitId}
                type="number"
                className={`form-control ${errors.monthlyLimit ? "is-invalid" : ""}`}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={monthlyLimit}
                onChange={(e) => {
                  setMonthlyLimit(e.target.value)
                  if (errors.monthlyLimit)
                    setErrors((prev) => ({ ...prev, monthlyLimit: "" }))
                }}
                required
              />
              {errors.monthlyLimit && (
                <div className="invalid-feedback">{errors.monthlyLimit}</div>
              )}
            </div>
          </div>

          <div className="row g-3 mb-4">
            {/* Month */}
            <div className="col-6">
              <label className="form-label fw-semibold" htmlFor={monthId}>
                Month
              </label>
              <select
                id={monthId}
                className="form-select"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="col-6">
              <label className="form-label fw-semibold" htmlFor={yearId}>
                Year
              </label>
              <input
                id={yearId}
                type="number"
                className="form-control"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary flex-fill fw-semibold"
              disabled={submitting}
              style={{ borderRadius: 10 }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving…
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2" />
                  Create Budget
                </>
              )}
            </button>
            <Link
              to="/"
              className="btn btn-outline-secondary"
              style={{ borderRadius: 10 }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
