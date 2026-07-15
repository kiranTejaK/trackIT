import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import type { Transaction, TransactionType } from "@/api/transactions"
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  transactionsApi,
} from "@/api/transactions"

const fmt = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

const PAGE_SIZE = 15

interface Toast {
  id: number
  message: string
  type: "success" | "error"
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  // Filters
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const addToast = (message: string, type: "success" | "error") => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await transactionsApi.list({
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setTransactions(res.data)
      setCount(res.count)
    } catch {
      addToast("Failed to load transactions.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, typeFilter, categoryFilter, dateFrom, dateTo])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await transactionsApi.delete(id)
      addToast("Transaction deleted.", "success")
      fetchTransactions()
    } catch {
      addToast("Failed to delete transaction.", "error")
    } finally {
      setDeletingId(null)
    }
  }

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const resetFilters = () => {
    setTypeFilter("")
    setCategoryFilter("")
    setDateFrom("")
    setDateTo("")
    setPage(0)
  }

  return (
    <div>
      {/* Toasts */}
      <div className="toast-container-custom">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <i
              className={`bi ${t.type === "success" ? "bi-check-circle text-success" : "bi-x-circle text-danger"}`}
            />
            <span style={{ fontSize: "0.875rem" }}>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1>Transactions</h1>
          <p>
            {count.toLocaleString()} total record{count !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/transactions/new"
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-lg" />
          Add Transaction
        </Link>
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: 16 }}
      >
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <label className="form-label small fw-semibold mb-1">Type</label>
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as TransactionType | "")
                  setPage(0)
                }}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <label className="form-label small fw-semibold mb-1">
                Category
              </label>
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(0)
                }}
              >
                <option value="">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <label className="form-label small fw-semibold mb-1">From</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-2">
              <label className="form-label small fw-semibold mb-1">To</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="col-auto">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={resetFilters}
              >
                <i className="bi bi-x-lg me-1" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border spinner-border-sm"
                style={{ color: "var(--ui-main)" }}
              />
              <p className="text-muted small mt-2 mb-0">Loading…</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state py-5">
              <div className="empty-icon">💸</div>
              <p className="text-muted">No transactions found</p>
              <Link to="/transactions/new" className="btn btn-primary btn-sm">
                Add your first transaction
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover tx-table mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-end">Amount</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td
                        className="ps-4 text-muted"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {fmtDate(tx.transaction_date)}
                      </td>
                      <td>
                        <span
                          className={
                            tx.type === "income"
                              ? "badge-income"
                              : "badge-expense"
                          }
                        >
                          {tx.type === "income" ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td>{tx.category}</td>
                      <td
                        className="text-muted text-truncate"
                        style={{ maxWidth: 180 }}
                        title={tx.description ?? ""}
                      >
                        {tx.description || "—"}
                      </td>
                      <td
                        className={`text-end fw-semibold ${tx.type === "income" ? "tx-amount-income" : "tx-amount-expense"}`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {fmt(tx.amount)}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-1 justify-content-end">
                          <Link
                            to={`/transactions/${tx.id}/edit`}
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit"
                          >
                            <i className="bi bi-pencil" />
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                            disabled={deletingId === tx.id}
                            onClick={() => handleDelete(tx.id)}
                          >
                            {deletingId === tx.id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <i className="bi bi-trash" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-transparent d-flex align-items-center justify-content-between px-4 py-3">
            <span className="text-muted small">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, count)} of {count}
            </span>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from(
                { length: Math.min(totalPages, 7) },
                (_, i) => i + Math.max(0, page - 3),
              ).map(
                (p) =>
                  p < totalPages && (
                    <button
                      key={p}
                      className={`btn btn-sm ${p === page ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </button>
                  ),
              )}
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
