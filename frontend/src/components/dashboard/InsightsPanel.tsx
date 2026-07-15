import type { SpendingInsight } from "@/api/dashboard"

export default function InsightsPanel({ insights }: { insights: SpendingInsight[] }) {
  if (insights.length === 0) {
    return (
      <div className="empty-state py-4">
        <div className="empty-icon mb-2">💡</div>
        <p className="text-muted small mb-0">No unusual spending insights this month.</p>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column gap-3">
      {insights.map((insight, idx) => (
        <div key={idx} className="d-flex p-3 rounded" style={{ backgroundColor: "var(--bs-tertiary-bg)", borderLeft: "4px solid var(--ui-main)" }}>
          <div className="me-3 fs-4">
            {insight.type === "CATEGORY_ANOMALY" ? "📊" : "💸"}
          </div>
          <div>
            <div className="fw-medium text-body" style={{ fontSize: "0.95rem" }}>
              {insight.message}
            </div>
            <div className="small text-muted mt-1">
              {insight.type === "CATEGORY_ANOMALY" ? "Category Spending Anomaly" : "Overall Large Expense"}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
