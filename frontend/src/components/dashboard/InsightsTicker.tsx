import type { SpendingInsight } from "@/api/dashboard"

interface Props {
  insights: SpendingInsight[]
}

export default function InsightsTicker({ insights }: Props) {
  const hasInsights = insights && insights.length > 0

  // If no insights, provide a default positive message
  const activeInsights = hasInsights
    ? insights
    : ([
        {
          message:
            "Your spending looks perfectly normal this month. Keep up the good work!",
          type: "INFO",
        },
      ] as any)

  // Duplicate the insights to create a seamless infinite loop
  const displayInsights = [...activeInsights, ...activeInsights]

  return (
    <div className="insights-ticker-container shadow-sm mb-4">
      <div className="insights-ticker-label">
        <i className="bi bi-lightbulb-fill me-2" style={{ color: "#f59e0b" }} />
        Smart Insights
      </div>
      <div className="insights-ticker-wrap">
        <div className="insights-ticker-move">
          {displayInsights.map((insight, index) => (
            <span key={index} className="insights-ticker-item">
              <span className="me-2 text-primary">•</span>
              {insight.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
