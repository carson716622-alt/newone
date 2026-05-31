# Police Scheduling System TODO

## Backend
- [x] Database schema: users, officers, shifts, shift_assignments, pto_requests, shift_swap_requests, overtime_records
- [x] Drizzle relations
- [x] Officer CRUD API routes (list, create, update, delete)
- [x] Shift CRUD API routes (list, create, update, delete)
- [x] Shift assignment API routes (assign, unassign, list by shift)
- [x] PTO request API routes (create, list, approve, deny)
- [x] Shift swap request API routes (create, accept, deny)
- [x] Overtime records API routes (list, summary by officer/week)
- [x] Dashboard stats API (shift coverage, shortage alerts, pending PTO count)

## Web Admin Frontend
- [x] App routing setup (Dashboard, Officers, Shifts, PTO, Swaps, Overtime)
- [x] Updated DashboardLayout with police scheduling nav items
- [x] Dashboard overview page (stats cards, shortage alerts, upcoming shifts)
- [x] Officers roster page (table, add/edit/delete officer modal)
- [x] Shifts management page (list view, create/edit shift modal)
- [x] Shift assignment panel (assign officers to shift, view assigned officers)
- [x] PTO management page (pending requests, approve/deny, history)
- [x] Shift swap requests page (view, approve/deny)
- [x] Overtime tracking page (officer hours summary, weekly breakdown)

## Mobile App (React Native / Expo)
- [ ] Initialize Expo mobile app in /home/ubuntu/police-scheduling-mobile
- [ ] Login screen with API auth
- [ ] Officer schedule view (calendar + list)
- [ ] Shift detail screen
- [ ] PTO request submission screen
- [ ] PTO request history screen
- [ ] Shift swap request screen
- [ ] Push notification setup

## Testing
- [x] Officer router unit tests
- [x] Shift router unit tests
- [x] PTO router unit tests
- [x] Auth integration tests

## GitHub
- [ ] Push web app to GitHub repo
- [ ] Push mobile app to GitHub repo
