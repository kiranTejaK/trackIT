import api from "@/api"
import type { SpendingInsight } from "./dashboard"

export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  amount: string
  type: TransactionType
  category: string
  description: string | null
  transaction_date: string
  created_at: string
  owner_id: string
}

export interface TransactionsResponse {
  data: Transaction[]
  count: number
}

export interface TransactionCreate {
  amount: number
  type: TransactionType
  category: string
  description?: string
  transaction_date: string
}

export interface TransactionUpdate {
  amount?: number
  type?: TransactionType
  category?: string
  description?: string
  transaction_date?: string
}

export interface TransactionWithInsights {
  transaction: Transaction
  insights: SpendingInsight[]
  budget_notifications: string[]
}

export interface ListTransactionParams {
  skip?: number
  limit?: number
  type?: TransactionType
  category?: string
  date_from?: string
  date_to?: string
}

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Bonus",
  "Interest",
  "Other Income",
]
export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Miscellaneous",
]

export const transactionsApi = {
  list: (params: ListTransactionParams = {}): Promise<TransactionsResponse> =>
    api.get("/api/v1/transactions/", { params }).then((r) => r.data),

  get: (id: string): Promise<Transaction> =>
    api.get(`/api/v1/transactions/${id}`).then((r) => r.data),

  create: (data: TransactionCreate): Promise<TransactionWithInsights> =>
    api.post("/api/v1/transactions/", data).then((r) => r.data),

  update: (id: string, data: TransactionUpdate): Promise<Transaction> =>
    api.put(`/api/v1/transactions/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    api.delete(`/api/v1/transactions/${id}`).then((r) => r.data),
}
