import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { budgetsApi } from "@/api/budgets"
import type { BudgetProgress } from "@/api/dashboard"

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

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const queryClient = useQueryClient()

  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => budgetsApi.list(month, year),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      deleteMutation.mutate(id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SAFE":
        return (
          <span className="badge bg-success bg-opacity-25 text-success">
            Safe
          </span>
        )
      case "WARNING":
        return (
          <span className="badge bg-warning bg-opacity-25 text-warning">
            Warning
          </span>
        )
      case "LIMIT_REACHED":
        return (
          <span className="badge bg-danger bg-opacity-25 text-danger">
            Limit Reached
          </span>
        )
      case "EXCEEDED":
        return <span className="badge bg-danger">Exceeded</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case "SAFE":
        return "bg-success"
      case "WARNING":
        return "bg-warning"
      case "LIMIT_REACHED":
      case "EXCEEDED":
        return "bg-danger"
      default:
        return "bg-primary"
    }
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Budgets</h1>
          <p className="text-muted mb-0">Manage your monthly spending limits</p>
        </div>
        <Link
          to="/budgets/new"
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <i className="bi bi-plus-lg" />
          Create Budget
        </Link>
      </div>

      <div
        className="card shadow-sm border-0 mb-4"
        style={{ borderRadius: "1rem" }}
      >
        <div
          className="card-body bg-body-tertiary border-bottom d-flex gap-3 align-items-end"
          style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
        >
          <div>
            <label className="form-label small text-muted fw-semibold mb-1">
              Month
            </label>
            <select
              className="form-select border-0 shadow-sm"
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
          <div>
            <label className="form-label small text-muted fw-semibold mb-1">
              Year
            </label>
            <input
              type="number"
              className="form-control border-0 shadow-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-danger p-5">
              <i className="bi bi-exclamation-triangle fs-1 mb-2" />
              <p>Failed to load budgets. Please try again later.</p>
            </div>
          ) : !budgets || budgets.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-wallet2 fs-1 mb-3 text-secondary" />
              <h5>No Budgets Found</h5>
              <p>You haven't set any budgets for this month.</p>
              <Link to="/budgets/new" className="btn btn-outline-primary mt-2">
                Create your first budget
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">Category</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th className="text-end">Spent / Limit</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b: BudgetProgress) => (
                    <tr key={b.id}>
                      <td className="ps-4 fw-medium">
                        <i className="bi bi-tag-fill text-muted me-2" />
                        {b.category}
                      </td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td style={{ width: "30%" }}>
                        <div className="progress" style={{ height: 8 }}>
                          <div
                            className={`progress-bar ${getProgressBarColor(b.status)}`}
                            style={{ width: `${b.progress_percentage}%` }}
                          />
                        </div>
                        <div className="small text-muted mt-1 text-end">
                          {b.progress_percentage.toFixed(0)}%
                        </div>
                      </td>
                      <td className="text-end">
                        <span
                          className={
                            b.status === "EXCEEDED" ? "text-danger fw-bold" : ""
                          }
                        >
                          ₹{b.spent.toLocaleString()}
                        </span>
                        <span className="text-muted mx-1">/</span>₹
                        {b.monthly_limit.toLocaleString()}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(b.id)}
                          title="Delete Budget"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
