import type { BudgetProgress } from "@/api/dashboard"

const fmt = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function BudgetProgressCard({
  budget,
}: {
  budget: BudgetProgress
}) {
  let progressColor = "var(--ui-main)"

  if (budget.status === "WARNING") {
    progressColor = "#f59e0b" // amber
  } else if (
    budget.status === "LIMIT_REACHED" ||
    budget.status === "EXCEEDED"
  ) {
    progressColor = "var(--expense-color)"
  }

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-end mb-2">
        <div>
          <span className="small text-muted me-1">Category:</span>
          <span className="fw-semibold text-body">{budget.category}</span>
        </div>
        <div className="small text-muted">
          Spent:{" "}
          <span className="fw-semibold text-body">{fmt(budget.spent)}</span> /
          Limit: {fmt(budget.monthly_limit)}
        </div>
      </div>

      <div
        className="progress"
        style={{ height: 8, backgroundColor: "var(--bs-tertiary-bg)" }}
      >
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: `${budget.progress_percentage}%`,
            backgroundColor: progressColor,
            transition: "width 0.6s ease",
          }}
          aria-valuenow={budget.progress_percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="d-flex justify-content-between mt-1">
        <span className="small text-muted">
          {budget.progress_percentage.toFixed(0)}% used
        </span>
        <span className="small fw-semibold" style={{ color: progressColor }}>
          {budget.status === "EXCEEDED"
            ? `Exceeded by ${fmt(Math.abs(Number(budget.remaining)))}`
            : `${fmt(budget.remaining)} left`}
        </span>
      </div>
    </div>
  )
}
