import type { CategoryDistribution } from "@/api/dashboard"

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
]

const fmt = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CategoryDistributionChart({
  data,
}: {
  data: CategoryDistribution[]
}) {
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <p className="text-muted small">No expense data yet</p>
      </div>
    )
  }

  return (
    <div>
      <div
        className="d-flex w-100 rounded-pill overflow-hidden mb-4 shadow-sm"
        style={{ height: "24px", backgroundColor: "var(--bs-tertiary-bg)" }}
      >
        {data.map((item, idx) => (
          <div
            key={item.category}
            title={`${item.category}: ${fmt(item.amount)} (${item.percentage.toFixed(1)}%)`}
            style={{
              width: `${item.percentage}%`,
              backgroundColor: COLORS[idx % COLORS.length],
              transition: "width 0.6s ease",
            }}
          />
        ))}
      </div>

      <div
        className="d-flex flex-column gap-2"
        style={{ maxHeight: "250px", overflowY: "auto" }}
      >
        {data.map((item, idx) => (
          <div
            key={item.category}
            className="d-flex align-items-center justify-content-between p-2 rounded"
            style={{ backgroundColor: "var(--bs-tertiary-bg)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle"
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: COLORS[idx % COLORS.length],
                }}
              />
              <span className="fw-medium text-body">{item.category}</span>
            </div>
            <div className="text-end">
              <div className="fw-semibold text-body">{fmt(item.amount)}</div>
              <div className="small text-muted">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
