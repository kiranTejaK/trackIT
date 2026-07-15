import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  transactionsApi,
} from "@/api/transactions"
import type { TransactionType } from "@/api/transactions"

const today = () => new Date().toISOString().split("T")[0]

export default function TransactionFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<TransactionType>("expense")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [transactionDate, setTransactionDate] = useState(today())

  const addToast = (message: string, toastType: "success" | "error" | "info") => {
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type: toastType } }))
  }

  // Load existing transaction for edit
  useEffect(() => {
    if (!id) return
    transactionsApi
      .get(id)
      .then((tx) => {
        setAmount(String(tx.amount))
        setType(tx.type)
        setCategory(tx.category)
        setDescription(tx.description || "")
        setTransactionDate(tx.transaction_date)
      })
      .catch(() => addToast("Failed to load transaction.", "error"))
      .finally(() => setLoading(false))
  }, [id])

  // Reset category when type changes
  useEffect(() => {
    setCategory("")
  }, [type])

  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = "Amount must be greater than 0"
    if (!category) errs.category = "Category is required"
    if (!transactionDate) errs.transactionDate = "Date is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const payload = {
      amount: parseFloat(amount),
      type,
      category,
      description: description.trim() || undefined,
      transaction_date: transactionDate,
    }

    try {
      if (isEdit && id) {
        await transactionsApi.update(id, payload)
        addToast("Transaction updated successfully.", "success")
        queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })
      } else {
        const response = await transactionsApi.create(payload)
        addToast("Transaction added successfully.", "success")
        queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })
        
        // Show insights and budget notifications if any
        if (response.insights && response.insights.length > 0) {
          response.insights.forEach(insight => {
            addToast(`Insight: ${insight.message}`, "info")
          })
        }
        if (response.budget_notifications && response.budget_notifications.length > 0) {
          response.budget_notifications.forEach(msg => {
            addToast(`Budget: ${msg}`, "info")
          })
        }
      }
      setTimeout(() => navigate("/transactions"), 2500) // increased timeout slightly to let user read toasts
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail || "Something went wrong. Please try again."
      addToast(detail, "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header d-flex align-items-center gap-3">
        <Link to="/transactions" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left" />
        </Link>
        <div>
          <h1>{isEdit ? "Edit Transaction" : "Add Transaction"}</h1>
          <p>{isEdit ? "Update the transaction details below" : "Record a new income or expense"}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "var(--ui-main)" }} role="status" />
        </div>
      ) : (
        <div className="form-card shadow-sm mx-auto">
          <form onSubmit={handleSubmit} noValidate>
            {/* Type Toggle */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Transaction Type</label>
              <div className="d-flex gap-2">
                {(["expense", "income"] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn flex-fill fw-semibold ${
                      type === t
                        ? t === "income"
                          ? "btn-success"
                          : "btn-danger"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setType(t)}
                    style={{ borderRadius: 10 }}
                  >
                    <i className={`bi ${t === "income" ? "bi-arrow-down-circle" : "bi-arrow-up-circle"} me-2`} />
                    {t === "income" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="form-label fw-semibold" htmlFor="tx-amount">
                Amount <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  id="tx-amount"
                  type="number"
                  className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }))
                  }}
                  required
                />
                {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="form-label fw-semibold" htmlFor="tx-category">
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="tx-category"
                className={`form-select ${errors.category ? "is-invalid" : ""}`}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  if (errors.category) setErrors((prev) => ({ ...prev, category: "" }))
                }}
              >
                <option value="">Select a category…</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <div className="invalid-feedback">{errors.category}</div>}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="form-label fw-semibold" htmlFor="tx-date">
                Transaction Date <span className="text-danger">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                className={`form-control ${errors.transactionDate ? "is-invalid" : ""}`}
                value={transactionDate}
                max={today()}
                onChange={(e) => {
                  setTransactionDate(e.target.value)
                  if (errors.transactionDate) setErrors((prev) => ({ ...prev, transactionDate: "" }))
                }}
              />
              {errors.transactionDate && (
                <div className="invalid-feedback">{errors.transactionDate}</div>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="form-label fw-semibold" htmlFor="tx-desc">
                Description <span className="text-muted fw-normal">(optional)</span>
              </label>
              <textarea
                id="tx-desc"
                className="form-control"
                rows={3}
                placeholder="Add a note about this transaction…"
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="form-text text-end">{description.length}/500</div>
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
                    {isEdit ? "Updating…" : "Saving…"}
                  </>
                ) : (
                  <>
                    <i className={`bi ${isEdit ? "bi-check-circle" : "bi-plus-circle"} me-2`} />
                    {isEdit ? "Update Transaction" : "Save Transaction"}
                  </>
                )}
              </button>
              <Link
                to="/transactions"
                className="btn btn-outline-secondary"
                style={{ borderRadius: 10 }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
