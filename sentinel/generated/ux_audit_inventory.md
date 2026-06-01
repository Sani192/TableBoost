# UX & Usability Audit Inventory

Rules, heuristics, layout integrity constraints, and errors validation checked by the Sentinel UX Auditor.

## Usability Guidelines Checked

| Heuristic Principle | UI element / Action | Expected Behavior |
| :--- | :--- | :--- |
| **Feedback during Load** | Navigation Drawer, List Views | Skeleton placeholders (`animate-pulse`) or loading spinners (`Loader2` spinner icon) are rendered during asynchronous fetches. |
| **Action Idempotency** | Click on Form Submissions | Save buttons in `/add-visit`, `/campaigns` edit, and reward redemption modals disable immediately upon click to prevent double clicks. |
| **Visual Hierarchy** | Locked dashboard cards | Features outside plan limits display visual Lock icons and greyed out panels to prevent user confusion. |
| **Cognitive Load Safety** | Error Banners / Warnings | API errors display clean, user-friendly warnings. Technical stack traces (SQL errors, pydantic models validation traces) are blocked from display. |
| **Uptime Support Code** | Error messages | Error messages display FastAPI correlation IDs (Support Codes) in parentheses to help support teams locate specific log entries in `OperationalLog` tables. |
| **Responsive Ergonomics** | Desktop Viewports (>=1280px) | Navigation sidebar is anchored; layouts utilize grid grids and filters inputs in panels. |
| **Responsive Ergonomics** | Mobile Viewports (375px) | Bottom navigation bar is active; modal pages slide in as full drawers; form inputs stack vertically. |
