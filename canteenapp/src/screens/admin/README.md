# Admin Module Structure

Use these files to modify admin features:

- `AdminDashboard.tsx`: Shell container (drawer, bottom tabs, shared state).
- `DashboardHome.tsx`: Dashboard home (header, stats, quick actions, active orders).
- `Orders.tsx`: Order management list and status progress.
- `Menu.tsx`: Menu listing with availability toggles and remove.
- `AdminAddMenuModal.tsx`: Modal to add a new veg item quickly.
- `AddItems.tsx`: Full add/edit item form screen.
- `SalesReport.tsx`: Sales and revenue overview.
- `Feedback.tsx`: Ratings and feedback list.
- `Users.tsx`: Users/admin view (currently single-admin use-case).
- `Profile.tsx`: Profile and theme toggle.
- `AdminSettings.tsx`: Canteen settings UI.
- `types.ts`: Shared admin types (`MenuItem`, `Order`).

Notes:
- Veg-only categories are enforced in UI (`Breakfast`, `Lunch`, `Snacks`, `Beverages`).
- Single admin access is enforced in navigation guard and login.
- Move shared logic into `types.ts` or a future `AdminContext.tsx` if needed.
