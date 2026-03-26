# ApplytoBlue - Project TODO

## Custom Authentication System
- [x] Build admin login API (tRPC)
- [x] Create admin login page UI
- [x] Test admin login with database
- [x] Build agency registration API
- [x] Create agency registration page UI
- [x] Build candidate registration API
- [x] Create candidate registration page UI
- [x] Implement session management
- [x] Add password hashing with bcryptjs
- [x] Connect all auth to database

## Job Posting System
- [x] Create job posting form for agencies
- [x] Build admin approval workflow
- [x] Display approved jobs on browse page

## Dashboards
- [x] Agency dashboard
- [x] Admin dashboard
- [x] Candidate dashboard

## Database & Backend
- [x] Extended database schema with 8 tables
- [x] Created database query helpers
- [x] Built comprehensive tRPC routers
- [x] Implemented password hashing

## Testing & Deployment Prep
- [ ] Test all authentication flows
- [ ] Test job posting workflow
- [ ] Test admin approval system
- [ ] Fix any remaining bugs
- [ ] Prepare for VPS deployment

## New Features - Completed
- [x] Fix home screen search to filter by state and ZIP code
- [x] Connect home search to approved jobs database
- [x] Build admin analytics dashboard with metrics
- [ ] Test all authentication flows
- [ ] Test job posting and approval workflow
- [ ] Test search functionality

## Featured Jobs Feature - Completed
- [x] Add featured field to database schema
- [x] Create tRPC procedures for featured jobs
- [x] Update admin panel to toggle featured status
- [x] Update home page to display featured jobs
- [x] Test featured jobs functionality

## Candidate Profile System - Completed
- [x] Extend database schema for candidate profiles
- [x] Create database query helpers for profiles
- [x] Build tRPC procedures for profile management
- [x] Create candidate profile edit page
- [x] Create candidate profile view page
- [x] Create admin candidate search and view page
- [x] Test candidate profile functionality

## Candidate-Agency Messaging System - Completed
- [x] Extend database schema for messages and conversations
- [x] Create database query helpers for messaging
- [x] Build tRPC procedures for messaging
- [x] Create messaging UI component
- [x] Create messaging page for candidates
- [x] Create messaging page for agencies
- [x] Add messaging routes to App.tsx
- [x] Test messaging functionality

## Candidate Profile Setup Wizard - Completed
- [x] Create profile setup wizard component (4-step guided process)
- [x] Create profile view/edit page with full details
- [x] Add profile button to navigation for candidates
- [x] Integrate setup wizard into registration flow
- [x] Test profile setup flow

## Job Application System - In Progress
- [ ] Update database schema for application forms
- [ ] Create database query helpers for applications
- [ ] Build tRPC procedures for application management
- [ ] Add application form upload to job posting
- [ ] Create candidate application download/upload page
- [ ] Create agency applications review dashboard
- [ ] Add application status tracking
- [ ] Test application workflow end-to-end

## Admin Job Deletion - In Progress
- [ ] Add delete job procedure to database helpers
- [ ] Add delete job tRPC procedure
- [ ] Add delete button to admin panel
- [ ] Test job deletion functionality

## Job Details Page with Smart Application Handling - Completed
- [x] Create detailed job posting page component
- [x] Add PDF viewer for in-site applications
- [x] Implement smart apply button (PDF vs external URL)
- [x] Add application submission tracking
- [x] Update browse jobs to link to details page
- [x] Test job details page functionality

## Bug Fixes - Completed
- [x] Fix JobDetails page to fetch approved jobs from database instead of localStorage
- [x] Ensure approved jobs are accessible via job details page
- [x] Fix jobs.getById returning undefined instead of null
- [x] Update JobDetails component to handle null response from query
- [x] Update BrowseJobs to fetch from database instead of localStorage

## Critical Bug - Job Creation Not Saving to Database - Completed
- [x] Fix Dashboard to save jobs to database via tRPC instead of localStorage
- [x] Update handleSubmit to call jobs.create tRPC mutation
- [x] Verify jobs are being saved to database
- [x] Test job creation and approval workflow end-to-end
- [x] Migrate existing jobs from localStorage to database
- [x] Fix BrowseJobs component to use correct database fields
- [x] Fix JobDetails component to use correct database fields
