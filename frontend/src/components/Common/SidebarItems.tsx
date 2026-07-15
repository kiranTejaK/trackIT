import { NavLink } from "react-router-dom"

interface Props {
  currentUser?: { email?: string; full_name?: string; is_superuser?: boolean } | null
  onClose?: () => void
  isCollapsed?: boolean
}

const navItems = [
  { to: "/", icon: "bi-grid-1x2-fill", label: "Dashboard", end: true },
  { to: "/transactions", icon: "bi-arrow-left-right", label: "Transactions" },
  { to: "/transactions/new", icon: "bi-plus-circle-fill", label: "Add Transaction" },
  { to: "/budgets", icon: "bi-wallet2", label: "Budgets" },
  { to: "/budgets/new", icon: "bi-plus-circle-fill", label: "Add Budget" },
]

const SidebarItems = ({ currentUser, onClose, isCollapsed = false }: Props) => {
  return (
    <div className="d-flex flex-column h-100" style={{ overflowX: "hidden" }}>
      {/* Brand */}
      <div className="mb-4 px-3" style={{ whiteSpace: "nowrap" }}>
        <span className="d-flex align-items-center py-1">
          <div style={{ position: "relative", width: "36px", height: "36px", minWidth: "36px" }}>
            <img 
              src="/assets/images/logo_rect.png" 
              alt="TrackIT" 
              className="logo-img" 
              style={{ 
                height: "36px", 
                objectFit: "contain",
                position: "absolute",
                opacity: isCollapsed ? 0 : 1,
                transition: "opacity 0.2s ease"
              }} 
            />
            <div 
              className="bg-primary text-white rounded d-flex align-items-center justify-content-center fw-bold" 
              style={{ 
                width: 36, 
                height: 36,
                position: "absolute",
                opacity: isCollapsed ? 1 : 0,
                transition: "opacity 0.2s ease",
                pointerEvents: isCollapsed ? "auto" : "none"
              }}
            >
              T
            </div>
          </div>
        </span>
        {currentUser?.email && (
          <p 
            className="text-muted small mb-0 mt-1" 
            style={{ 
              opacity: isCollapsed ? 0 : 1, 
              transition: "opacity 0.2s ease",
              pointerEvents: isCollapsed ? "none" : "auto"
            }}
          >
            {currentUser.full_name || currentUser.email}
          </p>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-grow-1 px-2">
        <ul className="nav flex-column gap-1" style={{ whiteSpace: "nowrap" }}>
          {navItems.map(({ to, icon, label, end }) => (
            <li key={to} className="nav-item">
              <NavLink
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded sidebar-link ${isActive ? "active" : "text-body"}`
                }
                title={isCollapsed ? label : undefined}
                style={{ transition: "background-color 0.15s ease, color 0.15s ease" }}
              >
                <i className={`bi ${icon}`} style={{ minWidth: "20px", textAlign: "center" }} />
                <span 
                  style={{ 
                    opacity: isCollapsed ? 0 : 1, 
                    transition: "opacity 0.2s ease",
                    pointerEvents: isCollapsed ? "none" : "auto"
                  }}
                >
                  {label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default SidebarItems
