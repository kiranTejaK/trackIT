import api from "@/api"

export const usersApi = {
  sendWeeklyReport: (): Promise<{ message: string }> =>
    api.post("/api/v1/users/me/weekly-report").then((r) => r.data),
}
