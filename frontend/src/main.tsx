import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import "./App.css"

import NotFound from "./components/Common/NotFound"
import BudgetFormPage from "./pages/BudgetFormPage"
import BudgetsPage from "./pages/BudgetsPage"
// TrackIT pages
import Dashboard from "./pages/Dashboard"
// Layout
import Layout from "./pages/Layout"
// Auth pages
import Login from "./pages/Login"
import RecoverPassword from "./pages/RecoverPassword"
import ResetPassword from "./pages/ResetPassword"
import SettingsPage from "./pages/SettingsPage"
import Signup from "./pages/Signup"
import TransactionFormPage from "./pages/TransactionFormPage"
import TransactionsPage from "./pages/TransactionsPage"

// Theme init
const savedTheme = localStorage.getItem("theme") || "light"
document.documentElement.setAttribute("data-bs-theme", savedTheme)

function isLoggedIn() {
  return localStorage.getItem("access_token") !== null
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  if (isLoggedIn()) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestOnly>
                <Signup />
              </GuestOnly>
            }
          />
          <Route
            path="/recover-password"
            element={
              <GuestOnly>
                <RecoverPassword />
              </GuestOnly>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestOnly>
                <ResetPassword />
              </GuestOnly>
            }
          />

          {/* Authenticated routes inside Layout */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/new" element={<TransactionFormPage />} />
            <Route
              path="transactions/:id/edit"
              element={<TransactionFormPage />}
            />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="budgets/new" element={<BudgetFormPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
