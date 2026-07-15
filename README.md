# TrackIT — The "Smart" Mini-Ledger
(Bytex Financial Ltd. Full Stack Engineer Challenge)

## Overview
TrackIT is a modern, fully dockerized personal financial ledger application designed to help individuals track their income and expenses, visualize their spending, and receive automated insights. It was built with a specific focus on robust architecture, polished aesthetics, and demonstrating technical depth.

## The Unique Twist: "Intelligent Spending Insights" & Redis Caching
For the Bytex Challenge "Unique Twist", I implemented two major features:
1. **Intelligent Spending Pattern**: Every time a user visits the dashboard, the backend instantly computes their all-time average daily spending. If their most recent transaction exceeds this average by a significant multiplier (≥ 3x), an "Intelligent Insight" warning banner dynamically appears on the Dashboard (e.g., *"This expense is 8× larger than your average daily spending."*). This provides immediate, algorithmic value to the user without requiring manual budget setup.
2. **Redis-Backed Dashboard**: To ensure the complex aggregations (monthly totals, category breakdowns, daily averages) don't burden the PostgreSQL database on every page load, the entire `/summary` response is cached in Redis. The cache is automatically invalidated whenever a transaction is created, updated, or deleted, ensuring the user always sees perfectly fresh data at blazing speeds.

## Additional Features
- **Weekly Report Emails**: Users can click a "Weekly Report" button on the Dashboard to instantly receive an HTML-formatted email summarizing their recent activity. This uses a Jinja2 template and sends through Brevo SMTP.
- **Flawless UI/UX**: The application uses a custom, responsive CSS design system (without Tailwind) featuring a dark theme, smooth micro-animations, and a completely jump-free collapsible sidebar.

## Engineering Judgment & AI Collaboration

This project was built leveraging AI as a *co-pilot*, not an *autopilot*. Throughout the development process, I applied my own engineering judgment to guide the architecture, refine the UI, and fix AI-generated bugs.

### 1. Handling UI Hallucinations & Layout Shifts
* **The Sidebar Collapse Bug**: When attempting to create a collapsible sidebar, the initial AI suggestion was to conditionally unmount the text labels (`{isCollapsed ? null : <span>Text</span>}`). This caused severe layout shifts and "jumpy" icons because the elements were physically removed from the DOM, changing the flexbox calculations.
* **The Human Fix**: I rejected that approach and implemented a CSS-driven solution using `white-space: nowrap` and transitioning `opacity` from 1 to 0 while keeping the text in the DOM. This resulted in a buttery smooth transition without altering the layout structure.

### 2. State Management vs. Over-Engineering
* **The Intelligence Feature**: When deciding how to implement the "Intelligent Spending Pattern", the AI suggested creating a new PostgreSQL table to store "historical daily averages" and running background cron jobs to update it. 
* **The Human Fix**: I recognized this was massive over-engineering for a mini-ledger. I instead opted for a stateless aggregation computed on the fly using SQLAlchemy's `group_by(func.date())`, and then cached the entire result in Redis. This achieved the exact same UX but with zero schema migrations and drastically lower complexity.

### 3. Font Normalization Strategy
* **The Issue**: The frontend UI had inconsistent font sizes due to a mix of custom CSS and Bootstrap defaults. The AI wanted to manually edit every single CSS class to hardcode `font-size: 14px`.
* **The Human Fix**: I chose to set `html { font-size: 14px; }` in the global `App.css`. Since Bootstrap relies heavily on `rem` units (which are relative to the root `html` font size), this single line of code cleanly and proportionately scaled down the entire application, giving it the denser, more "app-like" feel that was required.

## Local Development
To run this project locally:

1. Clone the repository.
2. Ensure you have the `.env` file populated (including Brevo SMTP credentials for email testing).
3. Run `docker compose up -d --build`.
4. The database migrations run automatically. 
5. Access the frontend at `http://localhost:5173`.
6. Access the backend API at `http://localhost:8000`.

**Default Login:**
- `admin@trackit.com` / `password1234`
