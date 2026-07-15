import api from "@/api"
import type { Transaction } from "./transactions"

export interface CategoryBreakdown {
  category: string
  total: string
  count: number
}

export interface SpendingInsight {
  type: "CATEGORY_ANOMALY" | "BUDGET_WARNING" | "TOP_CATEGORY"
  message: string
}

export interface BudgetProgress {
  id: string
  category: string
  monthly_limit: string
  spent: string
  remaining: string
  progress_percentage: number
  status: "SAFE" | "WARNING" | "LIMIT_REACHED" | "EXCEEDED"
  month: number
  year: number
}

export interface CategoryDistribution {
  category: string
  amount: string
  percentage: number
}

export interface DashboardSummary {
  total_income: string
  total_expense: string
  net_cash_flow: string
  net_cash_flow_helper: string
  total_transactions: number
  monthly_income: string
  monthly_expense: string
  budget_overview: BudgetProgress[]
  category_distribution: CategoryDistribution[]
  latest_transactions: Transaction[]
  smart_insights: SpendingInsight[]
}

export interface MonthlySummary {
  year: number
  month: number
  total_income: string
  total_expense: string
  balance: string
  transaction_count: number
}

export interface CategorySummary {
  category: string
  total: string
  count: number
  percentage: number
}

export const dashboardApi = {
  getSummary: (year?: number, month?: number): Promise<DashboardSummary> =>
    api.get("/api/v1/dashboard/summary", { params: { year, month } }).then((r) => r.data),

  getMonthlySummary: (year?: number, month?: number): Promise<MonthlySummary> =>
    api.get("/api/v1/summary/monthly", { params: { year, month } }).then((r) => r.data),

  getCategorySummary: (type?: "income" | "expense"): Promise<CategorySummary[]> =>
    api.get("/api/v1/summary/categories", { params: { type } }).then((r) => r.data),

  getRecent: (limit = 10): Promise<Transaction[]> =>
    api.get("/api/v1/summary/recent", { params: { limit } }).then((r) => r.data),
}
