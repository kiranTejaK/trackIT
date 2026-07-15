import { Outlet } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import Navbar from "../components/Common/Navbar"
import Sidebar from "../components/Common/Sidebar"

interface Toast {
  id: number
  message: string
  type: "success" | "error" | "info"
}

export default function Layout() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent
      const { message, type } = customEvent.detail
      const toastId = ++toastCounter.current
      setToasts((prev) => [...prev, { id: toastId, message, type }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 8000)
    }

    window.addEventListener("app-toast", handleToast)
    return () => window.removeEventListener("app-toast", handleToast)
  }, [])

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Global Toasts */}
      <div className="toast-container-custom">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <i className={`bi ${t.type === "success" ? "bi-check-circle text-success" : t.type === "error" ? "bi-x-circle text-danger" : "bi-info-circle text-info"}`} />
            <span style={{ fontSize: "0.875rem" }}>{t.message}</span>
          </div>
        ))}
      </div>

      <Sidebar />
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{ minHeight: "100vh", minWidth: 0 }}
      >
        <Navbar />
        <main className="flex-grow-1 overflow-auto p-3 p-md-4" style={{ minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
