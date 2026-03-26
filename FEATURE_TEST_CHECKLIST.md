# ApplytoBlue Feature Testing Checklist

This document outlines all features that should be tested to ensure the platform works correctly.

## Authentication System

### Admin Login
- [ ] Navigate to `/admin-login`
- [ ] Enter invalid credentials - should show error message
- [ ] Enter valid credentials (carson716622@gmail.com / carson123) - should redirect to admin panel
- [ ] Session persists after page refresh
- [ ] Logout clears session and redirects to home

### Agency Registration
- [ ] Navigate to `/agency-register`
- [ ] Fill in all required fields (department name, address, phone, email, website, officer count)
- [ ] Try to register with existing email - should show error
- [ ] Successfully register new agency
- [ ] Can login with registered credentials
- [ ] Agency profile displays correctly in dashboard

### Agency Login
- [ ] Navigate to `/agency-login`
- [ ] Enter invalid credentials - should show error
- [ ] Enter valid agency credentials - should redirect to dashboard
- [ ] Session persists after page refresh

### Candidate Registration
- [ ] Navigate to `/candidate-auth`
- [ ] Switch to Register tab
- [ ] Fill in name, email, password
- [ ] Password validation (must be 8+ characters)
- [ ] Confirm password matches
- [ ] Successfully register
- [ ] Auto-login after registration
- [ ] Can login with registered credentials

### Candidate Login
- [ ] Navigate to `/candidate-auth`
- [ ] Enter invalid credentials - should show error
- [ ] Enter valid candidate credentials - should redirect to browse page
- [ ] Session persists after page refresh

## Job Posting Workflow

### Job Creation (Agency)
- [ ] Login as agency
- [ ] Navigate to dashboard
- [ ] Click "Post New Job"
- [ ] Fill in all required fields:
  - [ ] Job title
  - [ ] City and state
  - [ ] ZIP code
  - [ ] Employment type
  - [ ] Role category
  - [ ] Job overview/description
  - [ ] Requirements
  - [ ] Salary (optional)
  - [ ] Application deadline
- [ ] Submit job posting
- [ ] Job appears in "My Jobs" list with "Pending" status
- [ ] Notification sent to admin

### Job Approval (Admin)
- [ ] Login as admin
- [ ] Navigate to admin panel
- [ ] See pending jobs in review queue
- [ ] Click on job to view details
- [ ] Click "Approve" button
- [ ] Job status changes to "Active"
- [ ] Approval email sent to agency
- [ ] Job appears in browse page

### Job Rejection (Admin)
- [ ] Login as admin
- [ ] Navigate to admin panel
- [ ] Select pending job
- [ ] Click "Reject" button
- [ ] Enter rejection reason
- [ ] Job status changes to "Rejected"
- [ ] Rejection email sent to agency with reason
- [ ] Job does NOT appear in browse page

## Job Search & Browsing

### Home Page Search
- [ ] Navigate to home page
- [ ] Search by keyword (job title)
  - [ ] Results filter correctly
  - [ ] Matching jobs display
- [ ] Search by state
  - [ ] Select state from dropdown
  - [ ] Results filter by state
  - [ ] All 50 states available
- [ ] Search by ZIP code
  - [ ] Enter ZIP code
  - [ ] Results filter by location
- [ ] Search by job type
  - [ ] Filter by Full-time, Part-time, Contract
  - [ ] Results filter correctly
- [ ] Combine multiple filters
  - [ ] All filters work together
  - [ ] Results are accurate
- [ ] Search with no results
  - [ ] Shows "No jobs found" message
  - [ ] Allows clearing search
- [ ] Job count displays correctly

### Browse Jobs Page
- [ ] Navigate to `/browse`
- [ ] See all approved jobs
- [ ] Click on job card
- [ ] Job detail page loads
- [ ] Can see full job description
- [ ] Can apply for job (if logged in as candidate)

## Job Applications

### Apply for Job (Candidate)
- [ ] Login as candidate
- [ ] Browse to approved job
- [ ] Click "Apply" button
- [ ] Application submitted successfully
- [ ] Confirmation message displayed
- [ ] Application appears in candidate's applications list
- [ ] Agency receives notification

### View Applications (Agency)
- [ ] Login as agency
- [ ] Navigate to dashboard
- [ ] See applications for posted jobs
- [ ] Click on application
- [ ] View candidate details
- [ ] Update application status (if available)

## Admin Analytics Dashboard

### Dashboard Access
- [ ] Navigate to `/admin/analytics`
- [ ] Only accessible when logged in as admin
- [ ] Redirects to login if not authenticated

### Key Metrics
- [ ] Total jobs posted displays correctly
- [ ] Pending approvals count is accurate
- [ ] Total candidates count displays
- [ ] Total applications count displays
- [ ] Conversion rate calculates correctly

### Trends Tab
- [ ] Job postings trend chart loads
- [ ] Shows posted, approved, rejected data
- [ ] Monthly approvals bar chart displays
- [ ] Charts are interactive (hover shows values)

### Distribution Tab
- [ ] Job types pie chart displays
- [ ] Application status pie chart displays
- [ ] Charts show correct percentages
- [ ] Legend displays all categories

### Performance Tab
- [ ] Top agencies list displays
- [ ] Agencies ranked by jobs/applications
- [ ] Conversion rates display correctly
- [ ] Recent activity feed shows latest events
- [ ] Activity types display with correct icons

### Export & Reports
- [ ] Click "Export Data" button
- [ ] CSV file downloads
- [ ] Click "Generate Report" button
- [ ] Success message displays

## Navigation & Layout

### Main Navigation
- [ ] Home page link works
- [ ] Browse jobs link works
- [ ] Login links work (admin, agency, candidate)
- [ ] Register links work
- [ ] Navigation responsive on mobile

### Protected Routes
- [ ] Admin routes require admin login
- [ ] Agency routes require agency login
- [ ] Candidate routes require candidate login
- [ ] Unauthorized access redirects to login

### Error Handling
- [ ] 404 page displays for invalid routes
- [ ] Error messages display for failed operations
- [ ] Validation errors show on forms
- [ ] Network errors handled gracefully

## Performance & UX

### Page Load Times
- [ ] Home page loads quickly
- [ ] Search results load within 2 seconds
- [ ] Admin dashboard loads within 3 seconds
- [ ] Analytics dashboard loads within 3 seconds

### Responsiveness
- [ ] All pages responsive on mobile (375px)
- [ ] All pages responsive on tablet (768px)
- [ ] All pages responsive on desktop (1920px)
- [ ] Touch interactions work on mobile
- [ ] Forms are usable on all screen sizes

### Accessibility
- [ ] Forms have proper labels
- [ ] Buttons are keyboard accessible
- [ ] Color contrast is sufficient
- [ ] Focus indicators visible
- [ ] Error messages clear and helpful

## Database Integration

### Data Persistence
- [ ] Job postings saved to database
- [ ] Applications saved to database
- [ ] User accounts saved to database
- [ ] Data persists after page refresh
- [ ] Data persists after logout/login

### Data Validation
- [ ] Required fields enforced
- [ ] Email format validated
- [ ] Password requirements enforced
- [ ] Duplicate emails rejected
- [ ] Invalid data rejected

## Security

### Password Security
- [ ] Passwords hashed (not visible in database)
- [ ] Password requirements enforced (8+ chars)
- [ ] Password confirmation required on signup
- [ ] Session tokens secure

### Authorization
- [ ] Users can only access their own data
- [ ] Admins can access all data
- [ ] Agencies can only edit their own jobs
- [ ] Candidates can only view approved jobs

### Input Validation
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF tokens used (if applicable)
- [ ] Rate limiting working (if implemented)

## Email Notifications

### Job Approval Email
- [ ] Email sent when job approved
- [ ] Email contains job details
- [ ] Email sent to correct agency email
- [ ] Email is professional and clear

### Job Rejection Email
- [ ] Email sent when job rejected
- [ ] Email contains rejection reason
- [ ] Email sent to correct agency email
- [ ] Email is professional and clear

### Application Confirmation Email
- [ ] Email sent when candidate applies
- [ ] Email contains job details
- [ ] Email sent to candidate email
- [ ] Email is professional and clear

## Integration Testing

### End-to-End Workflow 1: Agency Posts Job
- [ ] Agency registers
- [ ] Agency logs in
- [ ] Agency posts job
- [ ] Admin approves job
- [ ] Job appears in browse
- [ ] Candidate applies
- [ ] All notifications sent

### End-to-End Workflow 2: Candidate Searches & Applies
- [ ] Candidate visits home
- [ ] Candidate searches by state and ZIP
- [ ] Candidate finds job
- [ ] Candidate registers
- [ ] Candidate logs in
- [ ] Candidate applies for job
- [ ] Application appears in agency dashboard

### End-to-End Workflow 3: Admin Manages Platform
- [ ] Admin logs in
- [ ] Admin views pending jobs
- [ ] Admin approves job
- [ ] Admin views analytics
- [ ] Admin exports data
- [ ] Admin generates report

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Issues & Notes

Use this section to document any known issues or special notes:

- Issue: [Description]
  - Status: [Open/In Progress/Resolved]
  - Workaround: [If applicable]

---

## Testing Sign-Off

- [ ] All features tested
- [ ] All tests passed
- [ ] No critical issues
- [ ] Ready for deployment

**Tested By**: _______________
**Date**: _______________
**Notes**: _______________
