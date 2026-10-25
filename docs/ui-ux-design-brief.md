# Hostel Management App — UI/UX Design Brief

Purpose: this document lists every screen the app needs, the fields each screen needs to collect or display, and the flow between screens. It is written for designing the UI/UX only — no implementation detail. Where a screen depends on data from the server, a simplified "response shape" is given so the design can account for real field names and empty/loading states.

Two roles only: **Student** and **Hostel Admin**. There is no super-admin / multi-hostel switcher — each admin only ever sees their own hostel.

---

## PART A — SHARED / AUTH SCREENS

### 1. Login Page
Fields:
- Email
- Password
- "Forgot password?" link

Flow:
- On success → routes to Student Home or Admin Home depending on role.
- On failure → inline error "Invalid credentials".
- A student's very first login is actually via the **Set New Password** flow below (admin creates the account, student never "registers").

Response shape (for state design only):
```json
{ "user": { "id", "email", "status", "role" }, "token": "..." }
```
`status` can be `PENDING_ACTIVATION`, `ACTIVE`, `INACTIVE`, `SUSPENDED` — design a blocked/disabled-account state for non-ACTIVE logins.

### 2. Forgot Password Page
Fields:
- Email

Flow:
- Submit → "If this email exists, a reset link has been sent" (don't reveal whether the email exists, for security).
- The actual reset happens via an emailed deep link that opens **Set New Password** with a token embedded — there is no in-app OTP or code-entry step.

### 3. Set New Password Page
Used for two flows: (a) first-time account activation after an admin creates a student, (b) completing a forgot-password reset. Same screen, different entry context (reached via emailed link). Design one friendly copy variant for "Welcome, set your password" vs "Reset your password".

Fields:
- New password
- Confirm new password

Flow:
- Opened only via a link/token (not manually navigable).
- Link expires in 5 minutes — design an expired/invalid-link state with a way to request a new link.
- On success → redirect to Login with a success toast.

---

## PART B — STUDENT SCREENS

### 4. Student Home
This is the student's landing screen after login. Three zones:

**A. Attendance block (top, most prominent)**
- If within the hostel's attendance window AND today's attendance not yet marked → show a large, primary "Mark Attendance" button.
- If outside the window, or already marked today → no button; instead show a status line, e.g. "Attendance marked for today" or "Attendance window: 8:30 PM – 10:00 PM".
- Design both states clearly — the button's prominence is the main feature of this screen.

Response shape driving this block:
```json
{ "canMarkAttendance": true, "announcementsData": [] }
```

**B. Announcements (below attendance)**
> Note: this list is not implemented on the backend yet (always empty today) — design it as a forward-looking section: a short feed of cards (title, short body, posted date, optional tag like "Urgent"). Keep it collapsible or capped at 2–3 items with a "See all" link, since you don't yet know real content volume.

**C. Upcoming events preview (below announcements)**
A short horizontal or stacked preview of the next 2–3 events, each showing event image, name, date/time, and a "See all" link to the full Events page.
Per-event fields available: name, description, start time, end time, image, optional external link, optional contact person name/phone, active/inactive flag.

### 5. Mark Attendance Flow (triggered from the Home button)
Fields / steps involved:
- Camera capture (selfie) — required.
- Location capture (GPS) — required, automatic, no manual field.

Flow:
- Tap "Mark Attendance" → camera opens → capture photo → app captures GPS in background → submit → success/failure screen.
- Success screen: confirmation ("Attendance marked at 8:42 PM").
- Possible failure states to design for: no reference photo on file yet (admin hasn't uploaded one) → block with "Contact admin to upload your photo"; outside geofence (recorded but not blocking — consider a soft warning like "You appear to be far from the hostel, your admin has been notified" rather than a hard stop); low face-match confidence (currently not blocking either, but worth a neutral "Verifying..." → "Marked" transition instead of a pass/fail readout, since matching score isn't enforced).
- One submission per day — once marked, the action is simply unavailable again until the next day.

### 6. Leave Application — My Leaves (list)
Shows the student's own leave requests.
Per-row fields: date range (from–to), reason (truncated), status (Pending / Approved / Rejected / Cancelled), rejection reason if rejected.

Flow:
- Primary button: "Apply for Leave" → opens the Apply form.
- Tapping a row → Leave Detail screen (full reason, dates, status, rejection reason, and — only while status is Pending — Edit and Cancel actions).
- A student can only have **one pending request at a time** — if one is already pending, disable/hide "Apply for Leave" and explain why, or route them to the existing pending request.

### 7. Apply for Leave Page
Fields:
- From date
- To date
- Reason (text)

Flow:
- Validate From ≤ To before submit (client-side, since the backend doesn't enforce this on edits).
- Submit → returns to My Leaves list with new item shown as "Pending".
- Edge case to design for: new dates overlapping an already-approved leave → inline error from server, explain clearly ("You already have approved leave in this range").

### 8. Edit Leave Application
Same fields as Apply, pre-filled. Only reachable while status is Pending. Includes a "Cancel this request" secondary action (confirmation dialog before cancelling).

### 9. Events Page (full list)
Grid or list of all upcoming events.
Fields per event: name, description, image, start date/time, end date/time, external link (if any, e.g. "Register here"), contact person name & phone (if any), active/inactive.

Flow:
- Filter/search by event name and date range (nice to have, matches backend filters).
- Tap an event → Event Detail screen (full description, all fields, map/directions not applicable, a "contact organizer" tap-to-call if phone present, an external link button if present).
- No RSVP/registration flow exists in the backend — "Register" (if eventLink present) opens an external link, it isn't an in-app signup.

### 10. Student Profile Page (read-only, no edit)
Students cannot edit their own profile — only admins can. Design it as a simple read-only profile view:
Fields shown: name, roll number, contact number, parent's mobile number, department, room number, profile photo.
Include a "Change password" entry point (goes to a change-password form, separate from forgot-password).

---

## PART C — HOSTEL ADMIN SCREENS

### 11. Admin Home / Dashboard
Primary purpose: attendance overview for the day (or a selected date/range), with drill-down.

Top: summary cards —
- Total students (in current filter scope)
- Present count
- Absent count (completely absent across the selected range, shown distinctly from "absent at least once" — see note below)

Filters available: single date OR a date range; by student name; by department; by room; by roll number; present/absent tab toggle; face-match confidence threshold (present tab only, "≥" or "≤" a percentage) — useful for admins spot-checking low-confidence matches.

**Present tab** — table/list of students who were present, each row: photo thumbnail, name, roll number, department, room, time marked, face-match %, a location flag/badge if they were outside the hostel radius when marking.

**Absent tab** — table/list of students absent on at least one day in the selected range, each row: name, roll number, department, room, parent's mobile, and the specific absent date(s) within the range (so if viewing a 3-day range, show exactly which of those days they missed).

> Design note: "Total absent" summary number and the absent list can legitimately show different counts — the summary counts students absent on *every* day of the range, the list shows anyone absent on *any* day. Add a small info tooltip/caption near the summary explaining this so admins aren't confused.

Tapping a present-tab row → a lightweight detail popover/sheet: larger photo, captured attendance image, exact time, GPS flag, face-match score.

### 12. Rooms — Listing Page
Table/grid of rooms: room number, capacity, occupied count, remaining vacancy (computed), quick filter: "show only rooms with vacancy".
Search by room number (prefix) or by a student's name/roll number (to find which room someone is in).
Primary action: "Add Room".

### 13. Add / Edit Room
Fields:
- Room number
- Capacity (number)

Flow:
- Room numbers must be unique within the hostel — show inline error on duplicate.
- Editing capacity down is blocked if it would go below the number of students currently in the room — show a clear error explaining why.

### 14. Room Detail Page
Shows: room number, capacity, current occupant count, and a list of students in the room (name, roll number, contact, department) with a link to each student's full profile.

### 15. Students — Listing Page
Table: photo thumbnail, name, roll number, department, room.
Filters: by name, by department, by room, by roll number (exact).
Primary action: "Add Student".

### 16. Add Student Page
Fields:
- Email
- Student name
- Contact number
- Parent's mobile number
- Department (dropdown)
- Roll number
- Room (optional, dropdown — can be assigned later)
- Profile photo (optional at creation, can be added later — needed before the student can mark attendance)

Flow:
- On submit, the system emails the student an account-activation link automatically — design a success state that says this explicitly ("An activation link has been sent to [email]").
- From the student's detail page, admin can manually resend the activation link if needed (only while the account is still un-activated).

### 17. Student Detail Page
Shows full profile: photo, name, roll number, contact, parent contact, department, room, account status (Pending Activation / Active / Inactive / Suspended).
Actions available:
- Edit profile (name, contact numbers, department, photo, room) — only when account status is Active.
- Change room (quick action, blocked if target room is full).
- Change status → Inactive or Suspended (cannot be reversed to Active from this screen — design a clear warning dialog since there's currently no "reactivate" action in the system).
- Resend activation link (only visible while still Pending Activation).
- View this student's leave history and attendance history (tabs or links out to filtered views of Parts C.11/C.18).

### 18. Leave Applications — Admin Listing Page
Summary cards at top: counts per status (Pending / Approved / Rejected / Cancelled) — these counts reflect the full matching set regardless of which status tab is currently selected, so they act as a stable overview even while filtering.
Table: student name, roll number, department, room, date range, reason (truncated), status.
Filters: by status (tab or dropdown), by student name, department, room, roll number.
Primary flow: tap a row → Leave Review Page.

### 19. Leave Review Page
Shows full leave request: student info, reason, date range, current status.
Actions (only available while status is Pending):
- Approve (single tap, confirm)
- Reject (requires typing a rejection reason before confirming)
Once approved/rejected, the screen becomes read-only, showing the final status and (if rejected) the reason given.

### 20. Events — Admin Listing & Management
Same list view as the student-facing Events page, plus:
Primary action: "Create Event".
Each row has Edit / Deactivate actions.

### 21. Create / Edit Event Page
Fields:
- Event name
- Description
- Start date & time
- End date & time
- Event image (optional)
- External link (optional, e.g. registration page)
- Contact person name (optional)
- Contact person phone (optional)
- Active toggle (for edit — lets an admin hide an event without deleting it)

Flow:
- No server-side validation that start is before end — add this check in the UI itself.
- Deactivating hides it from the student-facing list but keeps the record (toggle, not delete).

### 22. Hostel Settings Page
A small settings area (likely under an admin "Settings" or "Hostel" menu) for configuring the attendance rules used across the app:
Fields:
- Hostel name, location, contact person, contact number
- Attendance marking window: start time, end time
- Attendance geofence radius (meters)

This is where the "Mark Attendance" window shown to students is actually configured, so make the time-window fields prominent with a preview of how they'll read to students (e.g., "Students can mark attendance between 8:30 PM and 10:00 PM").

---

## PART D — OPTIONAL / BONUS: MESS FEES (exists in backend, wasn't in your original list — include if useful, otherwise skip)

### 23. Mess Bills — Admin Listing
Table: month, year, amount, due date, status (Draft / Published / Expired).
Primary action: "Create Bill" (only one bill per month+year per hostel).
Row actions: Edit and Delete (only while Draft), Publish (locks it — irreversible, confirm dialog).

### 24. Create / Edit Mess Bill
Fields:
- Month (dropdown)
- Year
- Amount
- Last date to pay

> Note: there's currently no screen for marking a student's payment as received or listing who has paid — that capability isn't built on the backend yet. If payment tracking matters for this release, flag it back to the backend team before designing it; otherwise, design the Mess Bills section as "publish & inform" only, not as a payment tracker, for now.

---

## Design notes / things to keep in mind across the whole app

- Every list screen (students, rooms, leaves, events, attendance) needs clear empty states and loading states — don't assume data is always present.
- Photos (student profile photo, attendance capture) are fetched via short-lived signed URLs — don't design any screen to cache/store a photo URL long-term; always assume a fresh fetch is needed when revisiting a screen.
- Admin actions are always scoped to their own hostel — there is no "switch hostel" control anywhere in the app.
- Student account states (Pending Activation / Active / Inactive / Suspended) should be visually distinct wherever shown, since several actions are gated on "must be Active".
