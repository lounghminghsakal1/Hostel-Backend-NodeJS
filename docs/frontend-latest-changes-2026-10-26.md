# Frontend handoff: student splash, announcements, and latest API changes

Date: 26 October 2026. This is an integration update to [the frontend API guide](frontend-updates-guide.md). Use this document for student splash and announcements, which were added after the earlier guide. Examples are fictional and describe committed code, not verified deployed responses.

## 1. Which changes are included?

Reviewed local branch heads:

| Branch | Head | Meaning |
| --- | --- | --- |
| `main` | `177eb35` | Current integration target |
| `sharmi/annoucements` | `48e8894` | Already included in main; no additional branch-only commits |

`main` includes the announcement branch through merge `45f5eed`. It also has later changes that the announcement branch head does not contain:

| Commit | Frontend-relevant change |
| --- | --- |
| `19ea876` | Student `/home` changed to `/splash_screen`; splash includes announcements, events, hostel, attendance flag, and user |
| `48e8894` | Announcement splash query uses today's IST calendar date; missing hostel returns 404 |
| `a436a96` | Students allowed to GET announcement list and detail; create/update remain admin-only |
| `177eb35` | Announcement list/detail use student hostel scope as well as admin hostel scope |
| `f7efa12` | Attendance present/absent list response adds `data.percentage` |
| `1487287` | Migration changes announcement date columns to DATE and audit columns to TIMESTAMPTZ(3) |
| `ea083ce` | Pagination is directly under `body.meta`, replacing `body.meta.meta` |

The working tree was clean when reviewed. Local branches were inspected without fetching remote updates. A migration commit does not prove the migration has been applied to the frontend's target deployment.

## 2. Shared request and display agreement

- `BASE_URL` includes the configured API prefix. Append `/students/splash_screen`, for example; do not append the API prefix twice.
- Authenticated requests use `Authorization: Bearer <access-token>`. Use the token for the current account, not a token left over from an admin login.
- Keep the frontend's default list size at 20: explicitly send `page=1&pageSize=20`. Backend defaults are still page 1 and size 10 if omitted. Maximum page size is 100.
- Read the parsed JSON as `body`. With Axios, `body = response.data`; with fetch, `body = await response.json()`.
- Send actual-moment inputs as UTC ISO strings with milliseconds, e.g. `2026-10-26T12:30:00.000Z`. Format returned moments in `Asia/Kolkata` for display.
- Send calendar-date inputs as `YYYY-MM-DD`, e.g. `2026-10-26`. Announcement/leave dates and bill due dates are calendar dates, not moments.
- Current DATE responses are still midnight-UTC strings. For known calendar-date fields only, preserve `value.slice(0, 10)`; do not shift them by timezone.
- Show returned business details, images, and relevant times. Hide `createdAt`/`updatedAt` audit metadata and keep technical IDs for actions/state.
- Attendance reporting time is a business field: show `reportedTime` as “Reported at” in IST. The API has no `reportedAt` property.

## 3. Student startup now uses one splash endpoint

```http
GET /students/splash_screen
Authorization: Bearer <student-token>
```

Allowed role: STUDENT. No request body, filters, or pagination parameters.

Replace the old `/students/home` call. The response data is flat: do not read `body.data.homeScreenData` or `body.data.splashScreenData`.

### Full example response

```json
{
  "status": "success",
  "message": "Student home screen data fetched successfully",
  "data": {
    "canMarkAttendance": true,
    "announcements": [
      {
        "id": 31,
        "title": "Water supply maintenance",
        "description": "Water supply will pause between 10 AM and noon.",
        "linkUrl": null,
        "status": "ACTIVE",
        "startDate": "2026-10-26T00:00:00.000Z",
        "endDate": "2026-10-27T00:00:00.000Z",
        "announcementType": "HOSTEL_ANNOUNCEMENT",
        "isImportant": true,
        "pushNotification": false,
        "createdAt": "2026-10-25T09:00:00.000Z",
        "updatedAt": "2026-10-25T09:00:00.000Z",
        "hostelId": 1
      }
    ],
    "upcomingEvents": [
      {
        "id": 9,
        "eventName": "Hostel residents meeting",
        "eventDescription": "Residents can discuss hostel facilities.",
        "startingAt": "2026-10-27T12:30:00.000Z",
        "endingAt": "2026-10-27T13:30:00.000Z",
        "isActive": true,
        "eventImageKey": "event_image/example-key",
        "eventLink": "https://example.com/event",
        "contactPersonName": "Demo Coordinator",
        "contactPersonPhone": "9000000005",
        "createdAt": "2026-10-25T09:00:00.000Z",
        "updatedAt": "2026-10-25T09:00:00.000Z",
        "hostelId": 1
      }
    ],
    "hostel": {
      "id": 1,
      "hostelName": "New Hostel",
      "attendanceMarkingStartTime": "20:30",
      "attendanceMarkingEndTime": "22:00"
    },
    "user": {
      "id": 15,
      "email": "student@example.com",
      "status": "ACTIVE",
      "role": {
        "id": 1,
        "roleName": "STUDENT"
      },
      "hostelAdminProfile": null,
      "studentProfile": {
        "id": 12,
        "hostelId": 1,
        "collegeId": 1
      }
    }
  },
  "errors": null
}
```

The success message still says “home screen”; this does not mean the old route or old response wrapper remains valid.

### What to show and where to read it

| UI area | Data path | Frontend behavior |
| --- | --- | --- |
| Hostel header | `body.data.hostel.hostelName` | Show hostel name |
| Attendance action | `body.data.canMarkAttendance` | Use server flag; see current limitation below |
| Attendance daily schedule | `body.data.hostel.attendanceMarkingStartTime`, `attendanceMarkingEndTime` | Display these strings as IST recurring times |
| Announcement cards | `body.data.announcements` | Show title, description/preview, type, important badge, calendar-date validity, and optional link |
| Event cards | `body.data.upcomingEvents` | Show image, name, description/preview, start/end in IST, contact details, optional link |
| Account data | `body.data.user` | Read email, status, and `role.roleName`; preserve IDs for state/actions |

Use the embedded arrays for initial home content; do not immediately make duplicate list requests just to populate the same previews. Add “View all” navigation to the corresponding listing page. Refetch splash on app foreground/re-entry when appropriate and after successfully marking attendance; do not cache the attendance flag indefinitely.

The two arrays are previews, not complete lists:

- Announcements: at most 5, same hostel, ACTIVE, with `startDate <= today <= endDate`. Today is the IST calendar date. Important items come first; ordering among equal-importance items is not explicitly defined.
- Events: at most 5, same hostel, `isActive=true`, and `endingAt >= now`. Includes ongoing AND future events, sorted by `startingAt` ascending then `id` ascending. It is not a future-start-only feed.
- An empty array is a valid empty state. There is no pagination or total count on the splash response. Five items do not prove there is a sixth item.
- Splash includes all scalar fields of each announcement/event. Calendar dates and moments need different display handling even though both may arrive as ISO strings.

The embedded `user.studentProfile` currently contains IDs only. Do not expect student name, roll number, phone, parent phone, department/room labels, or photo here. Display those only when available from already-loaded profile data or a supported profile endpoint. The existing `GET /students/:id` remains admin-only; a student must not call it to fill in missing splash fields. The splash `user.role` is an object, whereas login returns a role string.

### Current splash blockers and limitations

1. **Backend blocker:** the committed `student.repository.js` calls `currentDate()` in `getAnnouncementsData`, but its imports currently only import `prisma`. The missing `currentDate` import makes that call throw `ReferenceError`, which can fail the entire splash response. Backend correction is required before this response can be consumed successfully; do not interpret this failure as empty announcements.
2. `canMarkAttendance` is still set to true outside the attendance window as a testing override. Treat the flag as a UI hint, not proof of final server eligibility. Backend must restore production behavior. Do not show “already marked” merely because the flag is false; false does not identify a unique reason.
3. The today's-attendance lookup still passes `new Date()` rather than an explicit IST calendar-date value. This can select a different calendar day near midnight IST. Backend needs to keep this consistent with attendance storage.
4. Both embedded lists are currently awaited as part of one request. If either query fails, the endpoint fails; the frontend cannot assume a partial success response will contain the other list.

## 4. Announcements: list, details, and admin forms

### Route and role matrix

| Method/path | STUDENT | HOSTEL_ADMIN |
| --- | --- | --- |
| `GET /announcements` | Allowed | Allowed |
| `GET /announcements/:id` | Allowed | Allowed |
| `POST /announcements` | Denied | Allowed |
| `PATCH /announcements/:id` | Denied | Allowed |
| `DELETE /announcements/:id` | No route enabled | No route enabled |

Main's latest fixes select the authenticated student's hostel for announcement reads. The branch head has role authorization for students, but lacks those later student-hostel fallbacks. Integrate against main or a deployment containing `177eb35`; role permission alone is not the whole fix.

Every announcement is still associated with a hostel, including type COLLEGE_ANNOUNCEMENT. That type is a category, not a promise of college-wide cross-hostel distribution.

### List filters

```http
GET /announcements?by_status=ACTIVE&page=1&pageSize=20
```

| Optional query parameter | Wire format | Meaning |
| --- | --- | --- |
| `by_announcement_title` | String | Trimmed partial, case-insensitive title search |
| `by_status` | `ACTIVE` or `INACTIVE` | Exact status |
| `by_announcement_type` | `COLLEGE_ANNOUNCEMENT`, `HOSTEL_ANNOUNCEMENT`, or `OTHER` | Exact category |
| `only_important` | `true` or `false` as a query string | true selects important items; false/omitted includes both |
| `from_date` | `YYYY-MM-DD` | Inclusive minimum announcement start date; requires `to_date` |
| `to_date` | `YYYY-MM-DD` | Inclusive maximum announcement end date; requires `from_date` |
| `page` | Positive integer string | Send 1 initially |
| `pageSize` | Integer string, 1–100 | Send 20 by default |

Example:

```http
GET /announcements?by_announcement_title=water&by_status=ACTIVE&by_announcement_type=HOSTEL_ANNOUNCEMENT&only_important=true&from_date=2026-10-01&to_date=2026-10-31&page=1&pageSize=20
```

Omit unused parameters. Reset to page 1 when changing filters. Both date boundaries are required together; inverted ranges return 422.

IMPORTANT: the date filter means **fully contained in the selected range** (`startDate >= from_date` AND `endDate <= to_date`). It is not an overlap filter. Do not use `from_date=today&to_date=today` to reproduce the splash's “valid today” behavior: that would exclude announcements spanning multiple days.

The list has no implicit ACTIVE or current-date filter. A student's “View all” page should explicitly request `by_status=ACTIVE` if that is the desired experience. That still does not mean “valid today.” Current student read endpoints can return INACTIVE, expired, or future announcements when requested; frontend filtering is not an access-control mechanism. Confirm desired visibility with the backend if inactive items must be private.

### List response

```json
{
  "status": "success",
  "message": "All announcements fetched successfully",
  "data": [
    {
      "id": 31,
      "title": "Water supply maintenance",
      "description": "Water supply will pause between 10 AM and noon.",
      "linkUrl": null,
      "status": "ACTIVE",
      "startDate": "2026-10-26T00:00:00.000Z",
      "endDate": "2026-10-27T00:00:00.000Z",
      "announcementType": "HOSTEL_ANNOUNCEMENT",
      "isImportant": true,
      "pushNotification": false,
      "createdAt": "2026-10-25T09:00:00.000Z",
      "updatedAt": "2026-10-25T09:00:00.000Z",
      "hostelId": 1
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Read list rows from `body.data` and pagination from `body.meta`. There is no `data.announcements` wrapper on this endpoint; that wrapper exists only inside the splash's data object.

For `GET /announcements/31`, `body.data` is one announcement object with those same fields, `errors` is null on success, and no pagination is returned. Same-hostel scoping applies; not found returns 404.

### Admin create and update

```http
POST /announcements
Content-Type: application/json
```

```json
{
  "title": "Water supply maintenance",
  "description": "Water supply will pause between 10 AM and noon.",
  "status": "ACTIVE",
  "announcementType": "HOSTEL_ANNOUNCEMENT",
  "startDate": "2026-10-26",
  "endDate": "2026-10-27",
  "pushNotification": false,
  "isImportant": true
}
```

Required: title, description, status, startDate, endDate, pushNotification, isImportant. `announcementType` is optional and defaults to OTHER in the database. `linkUrl` is optional but must be a valid URL when supplied. Send JSON booleans in request bodies, not `"true"` strings. Do not send hostelId, audit timestamps, or an ID in the body.

Start/end are calendar dates; end must be on or after start. Date-only input is strict. Create returns 201 and `body.data` is the created announcement. Update uses `PATCH /announcements/:id`, returns 200, and accepts changed fields only. Backend merges incoming dates with the existing dates before checking order.

An unchecked optional URL should be omitted rather than sent as an empty string. The schema currently accepts neither null nor empty URL values, so clearing an existing link is not yet supported. Do not display a functioning Delete button; the route remains disabled.

Show title, description, status/category labels, date validity, an Important badge when true, and an Open link action when linkUrl exists. Show `pushNotification` as an admin configuration field if useful. It currently stores a flag only; this module does not send push notifications. Do not promise “notification sent” from this flag. Hide admin edit controls for students.

## 5. “View all events” and event images

Use `GET /upcoming_events` for the full events page and `GET /upcoming_events/:id` to open an event. Both allow student and admin tokens. The splash preview already includes descriptions/contact details and can be used to open an immediate details panel.

Resolve non-null `eventImageKey` through:

```http
GET /media/download_url?image_key=<URL-encoded-object-key>
```

Use the returned `body.data.downloadUrl`. Signed URLs expire, so refresh when needed. Hide absent image/link/contact actions rather than rendering broken UI. Announcements do not currently have an image field; student profile images are not present in the new splash user object either.

Existing event-list limitations remain relevant:

- Explicitly send `is_active=true` for active events. `is_active=false` currently means no active-status restriction, and omission has an invalid string-default issue. Do not treat it as an inactive-only filter.
- The events listing currently ignores skip/take in its repository even though it returns pagination metadata. It is different from the correctly limited five-event splash preview. Do not append repeated server pages as if each contained a new set of events.
- Event date-filter boundaries currently use UTC days and full-containment logic, not IST-day overlap logic. See the earlier guide before enabling those controls.

## 6. Attendance response adds percentage on main

For `GET /attendance_records`, both present and absent modes now include:

```json
{
  "status": "success",
  "message": "Attendance records fetched successfully",
  "data": {
    "summary": {
      "totalStudentsOfTheHostel": 0,
      "totalStudentsWithatleastOnePresentDuringDateFilter": 0,
      "completelyAbsentStudentsCountDuringDates": 0
    },
    "attendanceRecords": [],
    "percentage": null
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Only `data.percentage` is new here; existing present/absent row shapes remain as documented in the earlier guide.

**Do not label this field “attendance percentage” or use it for a present/absent progress chart.** The current calculation is:

```text
round(rows returned on this page / all matching rows × 100)
```

For example, 20 returned rows out of 100 matching rows gives 20. A final page of 5 out of 45 gives 11. It changes with page size and page position. Zero matching rows produces NaN internally, which JSON serializes as null. Handle it as a nullable number and keep it out of attendance-rate UI until the backend defines a meaningful rate.

Do not confuse `data.percentage` with each present row's `faceMatchingPercentage`. The latter is the face-verification score to display per student. Continue showing `reportedTime` in IST, student/profile and captured images when available, roll number, room/department, contact details, location distance, and inside/outside badge. An absent day has no reported timestamp or captured attendance photo.

Student attendance actions still use `POST /attendance_records` with a student token; `GET /attendance_records` is admin-only. A student image-download call must not use the admin-only `/media/attendance_image/download_url`; use the generic `/media/download_url` endpoint when an image key must be resolved.

## 7. Other frontend requirements carried forward

- Pagination is flat `body.meta` across the current list controllers; always request size 20 by default.
- The admin startup endpoint stays `GET /hostel_admin/splash_screen`, with admin name/hostel/college. It is separate from the student splash endpoint described above.
- On student lists/details and attendance/leave screens, show student profile images when the respective response supplies a key/URL. Show business details and relevant business times, while hiding createdAt/updatedAt metadata.
- The admin student-details page must show roll number, phone, and parent mobile with edit controls. Phone and parent-mobile saving is supported. Roll-number input is accepted by validation but still not passed through the student update service/repository; do not claim it saved until backend persistence is implemented and verified by refetching.
- Filter names differ between module endpoints. See the existing guide rather than sending the same query object to all listing APIs.

## 8. Frontend implementation checklist

1. Replace the student `/home` request with `/students/splash_screen` and read the flat data object.
2. Use the embedded announcements/events arrays for initial previews; remove duplicate startup list calls.
3. Add Important/category/date labels and full announcement/event details with safe optional links and image handling.
4. Add “View all announcements” and student-accessible announcement details. Use explicit status filters and understand full-containment date filtering.
5. Keep announcement create/edit controls admin-only and omit Delete until a route is enabled.
6. Read every list's pagination directly from meta and send pageSize=20.
7. Handle attendance percentage as a nullable page-share value, not an attendance rate.
8. Refetch splash after attendance and when returning to the app; don't assume the flag guarantees posting will succeed.
9. Provide loading/error/empty states. A splash error must not silently become an empty announcement list. Confirm the missing-currentDate-import blocker is resolved on the deployment before acceptance testing.

### Acceptance checks

- Student token loads the new splash response once the backend blocker is fixed; admin token is rejected on the student route.
- App renders valid empty announcement/event arrays and at most five items in each preview.
- A future active event with an end time after now can appear in the splash; an ended event cannot.
- A multi-day active announcement includes both its start and end date in the splash validity window.
- Student can read own-hostel announcements on main and cannot edit them.
- An incomplete or reversed announcement query range shows the 422 error instead of clearing the current screen silently.
- Detail screens render calendar dates unchanged and display actual moments in IST.
- Empty attendance results render safely when percentage is null.

This documentation was prepared by inspecting the named local commits and the current controller/schema/query code. No branch was switched, merged, or pushed; no application code, database rows, or migration state was changed.
