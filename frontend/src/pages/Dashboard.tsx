import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { dashboardApi } from "@/api/dashboard"
import { usersApi } from "@/api/users"
import BudgetProgressCard from "@/components/dashboard/BudgetProgressCard"
import CategoryDistributionChart from "@/components/dashboard/CategoryDistributionChart"
import InsightsTicker from "@/components/dashboard/InsightsTicker"

const fmt = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

export default function Dashboard() {
  const [sendingReport, setSendingReport] = useState(false)
  const [reportSuccess, setReportSuccess] = useState("")

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => dashboardApi.getSummary(),
  })

  const handleSendReport = async () => {
    setSendingReport(true)
    setReportSuccess("")
    try {
      await usersApi.sendWeeklyReport()
      setReportSuccess("Weekly report sent successfully to your email!")
      setTimeout(() => setReportSuccess(""), 5000)
    } catch (_err) {
      alert("Failed to send weekly report. Ensure SMTP settings are correct.")
    } finally {
      setSendingReport(false)
    }
  }

  if (isLoading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div
            className="spinner-border"
            style={{ color: "var(--ui-main)" }}
            role="status"
          />
          <p className="mt-3 text-muted small">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-4">
        <i className="bi bi-exclamation-triangle me-2" />
        {error.message || "Failed to load dashboard data."}
      </div>
    )
  }

  if (!summary) return null

  const netCashFlow = Number(summary.net_cash_flow)
  const netCashFlowColor =
    netCashFlow >= 0 ? "var(--income-color)" : "var(--expense-color)"

  return (
    <div>
      {/* Page Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1>Dashboard</h1>
          <p>Your financial overview at a glance</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={handleSendReport}
            disabled={sendingReport}
          >
            {sendingReport ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <i className="bi bi-envelope-paper" />
            )}
            Weekly Report
          </button>
          <Link
            to="/transactions/new"
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <i className="bi bi-plus-lg" />
            Add Transaction
          </Link>
        </div>
      </div>

      {reportSuccess && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm mb-4">
          <i className="bi bi-check-circle-fill me-2" />
          {reportSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setReportSuccess("")}
          />
        </div>
      )}

      {/* Smart Insights Ticker */}
      <InsightsTicker insights={summary.smart_insights || []} />

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card stat-card-income shadow-sm">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="stat-icon"
                style={{
                  background: "var(--income-bg)",
                  color: "var(--income-color)",
                }}
              >
                <i className="bi bi-arrow-down-circle-fill" />
              </div>
              <span className="stat-label">Total Income</span>
            </div>
            <div
              className="stat-value"
              style={{ color: "var(--income-color)" }}
            >
              {fmt(summary.total_income)}
            </div>
            <div className="stat-sub mt-1">
              This month: <strong>{fmt(summary.monthly_income)}</strong>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card stat-card-expense shadow-sm">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="stat-icon"
                style={{
                  background: "var(--expense-bg)",
                  color: "var(--expense-color)",
                }}
              >
                <i className="bi bi-arrow-up-circle-fill" />
              </div>
              <span className="stat-label">Total Expense</span>
            </div>
            <div
              className="stat-value"
              style={{ color: "var(--expense-color)" }}
            >
              {fmt(summary.total_expense)}
            </div>
            <div className="stat-sub mt-1">
              This month: <strong>{fmt(summary.monthly_expense)}</strong>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card stat-card-balance shadow-sm">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="stat-icon"
                style={{
                  background: "var(--balance-bg)",
                  color: "var(--balance-color)",
                }}
              >
                <i className="bi bi-wallet2" />
              </div>
              <span className="stat-label">Net Cash Flow</span>
            </div>
            <div className="stat-value" style={{ color: netCashFlowColor }}>
              {fmt(summary.net_cash_flow)}
            </div>
            <div className="stat-sub mt-1">{summary.net_cash_flow_helper}</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card stat-card-total shadow-sm">
            <div className="d-flex align-items-center gap-3 mb-2">
              <div
                className="stat-icon"
                style={{
                  background: "var(--ui-main-light)",
                  color: "var(--ui-main)",
                }}
              >
                <i className="bi bi-list-ul" />
              </div>
              <span className="stat-label">Transactions</span>
            </div>
            <div className="stat-value" style={{ color: "var(--ui-main)" }}>
              {summary.total_transactions.toLocaleString()}
            </div>
            <div className="stat-sub mt-1">Total recorded entries</div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="row g-3 mb-4">
        {/* Monthly Budgets */}
        <div className="col-12">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: 16 }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                  <i
                    className="bi bi-bullseye"
                    style={{ color: "var(--ui-main)" }}
                  />
                  Monthly Budgets
                </h2>
                <Link
                  to="/budgets/new"
                  className="btn btn-sm btn-outline-primary"
                >
                  Create Budget
                </Link>
              </div>

              {summary.budget_overview.length === 0 ? (
                <div className="empty-state py-4">
                  <div className="empty-icon mb-2">🎯</div>
                  <p className="text-muted small">
                    No monthly budgets created yet.
                  </p>
                </div>
              ) : (
                summary.budget_overview.map((b) => (
                  <BudgetProgressCard key={b.id} budget={b} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="row g-3">
        {/* Category Distribution */}
        <div className="col-12 col-lg-5">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: 16 }}
          >
            <div className="card-body p-4">
              <h2 className="h6 fw-bold mb-4 d-flex align-items-center gap-2">
                <i
                  className="bi bi-pie-chart"
                  style={{ color: "var(--ui-main)" }}
                />
                Category Distribution
              </h2>
              <CategoryDistributionChart
                data={summary.category_distribution || []}
              />
            </div>
          </div>
        </div>

        {/* Latest Transactions */}
        <div className="col-12 col-lg-7">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: 16 }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                  <i
                    className="bi bi-clock-history"
                    style={{ color: "var(--ui-main)" }}
                  />
                  Recent Transactions
                </h2>
                <Link
                  to="/transactions"
                  className="btn btn-sm btn-outline-secondary"
                >
                  View All
                </Link>
              </div>

              {summary.latest_transactions.length === 0 ? (
                <div className="empty-state py-4">
                  <div className="empty-icon mb-2">💸</div>
                  <p className="text-muted small">
                    No recent transactions found.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover tx-table mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.latest_transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td
                            className="text-muted"
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
                              {tx.category}
                            </span>
                          </td>
                          <td
                            className="text-truncate"
                            style={{ maxWidth: 160 }}
                          >
                            {tx.description || (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td
                            className={`text-end fw-semibold ${tx.type === "income" ? "tx-amount-income" : "tx-amount-expense"}`}
                          >
                            {tx.type === "income" ? "+" : "-"}
                            {fmt(tx.amount)}
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
      </div>
    </div>
  )
}
