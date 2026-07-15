import api from "@/api"
import type { BudgetProgress } from "./dashboard"

export interface BudgetCreate {
  category: string
  monthly_limit: number
  month: number
  year: number
}

export interface BudgetUpdate {
  monthly_limit: number
}

export const budgetsApi = {
  list: (month: number, year: number): Promise<BudgetProgress[]> =>
    api.get("/api/v1/budgets/", { params: { month, year } }).then((r) => r.data),

  create: (data: BudgetCreate): Promise<BudgetProgress> =>
    api.post("/api/v1/budgets/", data).then((r) => r.data),

  update: (id: string, data: BudgetUpdate): Promise<BudgetProgress> =>
    api.put(`/api/v1/budgets/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/v1/budgets/${id}`).then((r) => r.data),
}
