# Frontend integration guide: dates, filters, and updated responses

Updated: 25 October 2026. This guide describes the current repository code, not a verified deployed API. Examples use fictional data. Backend issues that affect integration are called out explicitly; this document does not imply they have been fixed.

## 1. Connection and shared rules

Use the frontend's configured API base URL, including the backend's configured `API_PREFIX`. Append the paths below once. For example, if `BASE_URL` is `https://your-host/api/v1`, call `${BASE_URL}/students`.

All endpoints in this guide require:

```http
Authorization: Bearer <access-token>
```

GET filters belong in query parameters. For JSON bodies, also send `Content-Type: application/json`.

| GET path | Allowed role | Purpose |
| --- | --- | --- |
| `/hostel_admin/splash_screen` | HOSTEL_ADMIN | Admin name, hostel name, college name |
| `/attendance_records` | HOSTEL_ADMIN | Present attendance or absent students |
| `/rooms` | HOSTEL_ADMIN | Room occupancy and vacancies |
| `/leave_applications` | HOSTEL_ADMIN | Leave requests and status counts |
| `/upcoming_events` | HOSTEL_ADMIN or STUDENT | Hostel events |
| `/students` | HOSTEL_ADMIN | Student profiles |

Hostel scope comes from the authenticated user. Do not send a hostel ID to select a different hostel.

### Query conventions

- Omit unused filters entirely. Do not send empty ID/percentage/date values, `null`, or the text `"undefined"`.
- Query values travel as strings. Positive IDs are converted to numbers by backend validation.
- Keep roll numbers as strings so leading zeros survive.
- Name searches are partial and case-insensitive. Roll-number searches are trimmed exact matches.
- Multiple supplied filters are combined with AND.
- Reset `page` to `1` whenever a filter changes. Debounce text searches and cancel or ignore stale requests.
- Use `URLSearchParams` or the HTTP client's query serializer instead of manually concatenating user text.

### Pagination

All five listing APIs accept:

| Parameter | Type on the wire | Frontend default | Rules |
| --- | --- | --- | --- |
| `page` | Integer string, e.g. `"1"` | 1 | At least 1 |
| `pageSize` | Integer string, e.g. `"20"` | 20 | Between 1 and 100 |

Initialize every list with `page=1` and `pageSize=20`, and explicitly send both values in requests. The backend still defaults to 10 if `pageSize` is omitted; 20 is the frontend's requested default. Apply the same size to any temporary client-side events pagination.

The current response returns pagination directly in `meta`:

```json
{
  "status": "success",
  "message": "Endpoint-specific message",
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Read `body.meta.page`, `body.meta.pageSize`, and `body.meta.totalPages`. The older `body.meta.meta` wrapper is no longer used. `totalCount`, `hasNextPage`, and `hasPreviousPage` are not returned. Even zero matching records currently produces `totalPages: 1`; show an empty state when the returned list is empty.

With Axios, `body` below means `response.data`. With fetch, it means `await response.json()`.

## 2. Date and time agreement

### Actual moments: send UTC ISO timestamps with milliseconds

For client-supplied actual moments, use exactly:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
2026-10-24T04:30:00.000Z
```

`Z` means UTC. Event `startingAt` and `endingAt` now require this format. Date-only values, timezone-less datetimes, `+05:30` inputs, and timestamps without three fractional-second digits are rejected by the shared `utcInstantSchema`.

These two displays describe the same instant:

```text
API:       2026-10-24T04:30:00.000Z
India UI:  24 October 2026, 10:00 AM IST
```

For an existing JavaScript Date representing the selected instant:

```js
const payload = {
  startingAt: selectedStartDate.toISOString(),
  endingAt: selectedEndDate.toISOString()
};
```

The selected Date must already represent the user's intended IST time. A bare `datetime-local` value has no timezone; do not append `Z` to Indian wall-clock time. For an India-only datetime-local input with minute precision, `2026-10-24T10:00`, an explicit conversion is:

```js
new Date(`${inputValue}:00+05:30`).toISOString();
// "2026-10-24T04:30:00.000Z"
```

That example assumes the input has exactly `YYYY-MM-DDTHH:mm` precision. Use the date-picker's supported timezone handling if it supplies a different shape.

Format returned instants for display using the named zone:

```js
const indiaDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short"
});

indiaDateTime.format(new Date(record.reportedTime));
```

Do not manually add 5.5 hours to a Date. Do not send formatted display strings such as `24/10/2026 10:00 AM` to the API.

Actual-moment fields include `createdAt`, `updatedAt`, `reportedTime`, `reviewedAt`, `paidAt`, `expiresAt`, `usedAt`, `startingAt`, and `endingAt`. Most are server-generated: do not add them to forms unless the API explicitly accepts them. The schema now declares these as timezone-aware PostgreSQL timestamps; deployment/migration and existing-data conversion must be handled by the backend separately.

### Calendar dates: send YYYY-MM-DD

These represent calendar days, not instants:

| Field | Request format |
| --- | --- |
| Leave `fromDate`, `toDate` | `"2026-10-24"` |
| Monthly mess bill `lastDate` | `"2026-10-31"` |
| Attendance `date`, `fromDate`, `toDate` query filters | `"2026-10-24"` |
| Event `from_date`, `to_date` query filters | `"2026-10-24"` |

Leave create example, `POST /leave_applications` (STUDENT):

```json
{
  "leaveReason": "Family function",
  "fromDate": "2026-10-24",
  "toDate": "2026-10-26"
}
```

Leave updates use the same date format. The service requires both dates together when changing the date range. Create validation checks date ordering; the update path currently does not enforce that ordering consistently, so prevent an inverted range in the form as well.

Mess bill payload example, `POST /mess_fee/mess_bill` (HOSTEL_ADMIN):

```json
{
  "month": "OCTOBER",
  "year": 2026,
  "amount": 2500,
  "lastDate": "2026-10-31"
}
```

CURRENT RESPONSE DIFFERENCE: PostgreSQL DATE fields come back through Prisma as Dates, and the current controllers serialize them as midnight-UTC strings, for example `"2026-10-24T00:00:00.000Z"`. They have not yet been converted to date-only response strings. Examples below show the actual current shape.

For known calendar-date fields only, preserve the date portion:

```js
const calendarDate = value == null ? null : value.slice(0, 10);
// Handles both "2026-10-24" and current "2026-10-24T00:00:00.000Z".
```

Do not apply this operation to actual moments such as `reportedTime`. Do not derive a user's selected calendar date with `selectedDate.toISOString().slice(0, 10)` unless its timezone meaning is deliberately handled; that can select the previous date.

Attendance daily start/end settings remain zero-padded IST strings such as `"20:30"` and `"22:00"`. They are recurring daily times, not UTC timestamps.

## 3. Hostel-admin splash screen

```http
GET /hostel_admin/splash_screen
```

No query parameters or request body.

```json
{
  "status": "success",
  "message": "Hostel admin splash screen data fetched successfully",
  "data": {
    "id": 7,
    "hostelAdminName": "Demo Admin",
    "hostel": {
      "hostelName": "New Hostel"
    },
    "college": {
      "collegeName": "Example College"
    }
  },
  "errors": null
}
```

Show the admin's name, hostel name, and college name in the splash/header/account area. Keep `id` for application state; it need not be a visible label. Do not expect email, phone, counts, or an image from this endpoint. If the profile is missing the current service can return `data: null`; handle it as an unavailable profile rather than dereferencing it.

The current mount is singular `/hostel_admin`; do not use the older `/hostel_admins/hostel_admin/splash_screen` path.

## 4. Attendance: present and absent

```http
GET /attendance_records
```

### Filters

All are optional, in addition to shared pagination.

| Parameter | Type/format | Meaning |
| --- | --- | --- |
| `date` | `YYYY-MM-DD` | One attendance calendar date |
| `fromDate` | `YYYY-MM-DD` | Inclusive first date; send with `toDate` |
| `toDate` | `YYYY-MM-DD` | Inclusive final date; send with `fromDate` |
| `status` | `present` or `absent` | Defaults to `present` |
| `by_student_name` | String | Partial, case-insensitive name |
| `by_student_department_id` | Positive integer string | Department ID |
| `by_student_room_id` | Positive integer string | Room ID, not room number |
| `by_roll_number` | String | Exact roll number |
| `by_face_matching_percentage` | Numeric string from 0 through 100 | Present-record percentage threshold; decimals allowed |
| `face_matching_operator` | `gte` or `lte` | Greater-than-or-equal / less-than-or-equal; current default is `lte` |

Send `date` OR the pair `fromDate` + `toDate`. Sending both modes, only one range endpoint, or a reversed range returns 422. Without dates, the backend selects today's IST calendar-date label.

Examples:

```http
GET /attendance_records?date=2026-10-24&status=present&by_student_department_id=2&page=1&pageSize=20
GET /attendance_records?date=2026-10-24&by_face_matching_percentage=80&face_matching_operator=gte
GET /attendance_records?fromDate=2026-10-20&toDate=2026-10-24&status=absent&by_student_room_id=3
```

Keep percentage controls on the present tab. Absent rows have no face percentage for an absent day, and the current absent-record query ignores that filter.

OUTSIDE-HOSTEL FILTER IS NOT WORKING YET: validation declares `is_outide_hostel` (misspelled), but the service reads `is_outside_hostel`. Neither spelling currently enables the service filter through the validated query. In addition, `z.coerce.boolean()` treats the nonempty query string `"false"` as true. Do not ship this control as functional until the backend fixes the name and boolean parsing. The returned `isLocatedWithinHostelRadius` field can still be displayed.

### Present response

```json
{
  "status": "success",
  "message": "Attendance records fetched successfully",
  "data": {
    "summary": {
      "totalStudentsOfTheHostel": 2,
      "totalStudentsWithatleastOnePresentDuringDateFilter": 1,
      "completelyAbsentStudentsCountDuringDates": 1
    },
    "attendanceRecords": [
      {
        "id": 101,
        "attendanceDate": "2026-10-24T00:00:00.000Z",
        "reportedTime": "2026-10-24T15:05:12.345Z",
        "capturedImageKey": "attendance_image/example-key",
        "faceMatchingPercentage": 92.5,
        "latitude": 10.830756,
        "longitude": 78.689962,
        "isLocatedWithinHostelRadius": true,
        "locationDeviationFromHostel": 42.8,
        "studentId": 12,
        "student": {
          "studentName": "Ravi Kumar",
          "rollNumber": "00123",
          "studentImageKey": "student_image/example-key",
          "contactNumber": "9000000001",
          "parentMobileNumber": "9000000002",
          "department": {
            "departmentName": "Computer Science"
          },
          "room": {
            "roomNumber": "NH-3-118"
          }
        }
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Read rows from `body.data.attendanceRecords` and cards from `body.data.summary`.

Show these present-table fields, using a details panel for less common fields:

| UI field | Response property |
| --- | --- |
| Student name / roll number | `student.studentName`, `student.rollNumber` |
| Department / room | `student.department.departmentName`, `student.room?.roomNumber` |
| Attendance day | `attendanceDate` as a calendar date |
| Reported at / Recorded at (required visible column) | `reportedTime`, displayed in IST with date and time |
| Captured photo / profile photo | `capturedImageKey`, `student.studentImageKey`, resolved through media API |
| Face match | `faceMatchingPercentage`, with `%` |
| Inside/outside radius badge | `isLocatedWithinHostelRadius` |
| Distance from hostel | `locationDeviationFromHostel`, in meters |
| Map action | `latitude`, `longitude` |
| Student/parent call actions | `student.contactNumber`, `student.parentMobileNumber` |

Always show the attendance reporting time alongside the attendance day. The UI label can be “Reported at”, but the actual API property is `reportedTime`, not `reportedAt`. For example, `2026-10-24T15:05:12.345Z` displays as 24 October 2026, 8:35 PM IST (include seconds if useful). `reportedTime` is a business timestamp and must remain visible even though audit metadata is hidden.

Use record `id` as the present row key. `reportedTime` is when the record was inserted, not a separate image-capture timestamp. A range can return multiple records for the same student on different days. Show the student's profile image wherever available, alongside the captured attendance photo; give both a larger preview action.

### Absent response

```json
{
  "status": "success",
  "message": "Attendance records fetched successfully",
  "data": {
    "summary": {
      "totalStudentsOfTheHostel": 2,
      "totalStudentsWithatleastOnePresentDuringDateFilter": 1,
      "completelyAbsentStudentsCountDuringDates": 1
    },
    "attendanceRecords": [
      {
        "studentName": "Meena Raj",
        "rollNumber": "00124",
        "contactNumber": "9000000003",
        "roomNumber": null,
        "department": "Computer Science",
        "parentMobileNumber": "9000000004",
        "studentImageKey": null,
        "absentDates": [
          "2026-10-24"
        ]
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Absent rows are flat: do not read `row.student.studentName` here. Show name, roll, department, room, profile photo if present, student/parent call actions, number of missed dates, and the actual `absentDates` in an expandable list or dialog. There is no attendance ID, captured photo, recorded time, face percentage, or location for an absent day. Use the roll number as a row key within the hostel-scoped response.

### Summary card meaning

- `totalStudentsOfTheHostel`: actually counts students matching the current student filters, despite the whole-hostel-sounding name. Label it “Matching students” when filters are active.
- `totalStudentsWithatleastOnePresentDuringDateFilter`: distinct students with at least one matching attendance record in the date selection.
- `completelyAbsentStudentsCountDuringDates`: total matching students minus the preceding count.
- On a range, the absent list includes anyone missing AT LEAST ONE selected day. The summary's completely absent count concerns missing EVERY selected day, so the card and absent-table count can differ.

CURRENT LIMITATION: percentage filtering also affects the summary's present count. A student with attendance outside the selected percentage threshold may be counted in the value named “completely absent.” Do not present that value as a reliable absence count while a percentage filter is active; hide the absence summary or label the cards as matching-record counts until backend summary filtering is separated. Do not infer absences from the visible present page.

## 5. Rooms list

```http
GET /rooms
```

| Optional parameter | Type/format | Meaning |
| --- | --- | --- |
| `starts_with` | String | Case-insensitive room-number prefix |
| `only_vacancy` | `"true"` or `"false"` | Defaults to false; true returns rooms with remaining capacity |
| `by_student_name` | String | Room contains a student matching the partial name |
| `by_student_roll_number` | String | Room contains a student with that exact roll number |

When both student filters are supplied, the SAME student must match both. Occupied/remaining numbers still count every student in the room, not just students matching the search.

```http
GET /rooms?starts_with=NH-3&only_vacancy=true&page=1&pageSize=20
```

```json
{
  "status": "success",
  "message": "All rooms fetched successfully",
  "data": [
    {
      "id": 3,
      "roomNumber": "NH-3-118",
      "capacity": 5,
      "occupied": 3,
      "remaining": 2
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Rows are `body.data`, not `body.data.rooms`. Show room number, capacity, occupied beds, remaining beds, and a Full/Vacant badge. Use `id` for room actions. No student list or room audit timestamps are returned by this listing. Vacancy filtering and the page count now use the filtered rooms.

For the occupants panel, the existing `GET /rooms/:id` returns the room with `studentProfiles` and `_count.studentProfiles`. Its occupants include name, roll, contact number, and department name. The detailed endpoint does not add the listing's computed `occupied`/`remaining` properties.

## 6. Leave applications list

```http
GET /leave_applications
```

| Optional parameter | Type/format | Meaning |
| --- | --- | --- |
| `by_student_name` | String | Partial case-insensitive name |
| `by_student_department_id` | Positive integer string | Department ID |
| `by_student_room_id` | Positive integer string | Room ID |
| `by_student_roll_number` | String | Exact roll number |
| `by_status` | One of the values below | Exact status filter |

Statuses are uppercase: `WAITING_FOR_APPROVAL`, `APPROVED`, `REJECTED`, `CANCELLED`. Omit `by_status` for all statuses. There is no `ALL` value. Current backend validation accepts any string and silently ignores unsupported statuses, so the UI must send only these documented values.

```http
GET /leave_applications?by_status=APPROVED&by_student_department_id=2&page=1&pageSize=20
```

```json
{
  "status": "success",
  "message": "All leave applications fetched successfully",
  "data": {
    "leaveApplications": [
      {
        "id": 41,
        "leaveReason": "Family function",
        "fromDate": "2026-10-24T00:00:00.000Z",
        "toDate": "2026-10-26T00:00:00.000Z",
        "status": "APPROVED",
        "rejectionReason": null,
        "studentId": 12,
        "createdAt": "2026-10-23T09:00:00.000Z",
        "updatedAt": "2026-10-23T10:00:00.000Z",
        "reviewedAt": null,
        "student": {
          "studentName": "Ravi Kumar",
          "contactNumber": "9000000001",
          "parentMobileNumber": "9000000002",
          "rollNumber": "00123",
          "studentImageKey": "student_image/example-key",
          "department": {
            "departmentName": "Computer Science"
          },
          "room": {
            "roomNumber": "NH-3-118"
          }
        }
      }
    ],
    "statusesCount": {
      "WAITING_FOR_APPROVAL": 2,
      "APPROVED": 1,
      "REJECTED": 1,
      "CANCELLED": 0
    }
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Read rows from `body.data.leaveApplications`. Show four status cards from `body.data.statusesCount`. Counts respect hostel/student filters but deliberately IGNORE `by_status` and pagination. Selecting Approved filters the table without zeroing out the other cards. Pagination counts the selected status's records.

Show name, roll, department, room, leave reason, start/end calendar dates, status badge, rejection reason when present, profile photo, and student/parent call actions. Hide `createdAt` and `updatedAt` as audit metadata; do not add a submitted-at column sourced from `createdAt`. `reviewedAt` is a business timestamp and can be shown when available. The backend currently does not populate it during review; display an unavailable placeholder when null, and do not label `updatedAt` as the review time.

For pending requests, provide Approve/Reject actions using the existing `PATCH /leave_applications/:id/review` endpoint:

```json
{
  "status": "REJECTED",
  "rejectionReason": "Please provide the required details"
}
```

The review API accepts only `APPROVED` or `REJECTED`. A rejection reason is required for rejection. Hide or disable review controls after the status leaves `WAITING_FOR_APPROVAL`.

## 7. Upcoming events list

```http
GET /upcoming_events
```

| Optional parameter | Type/format | Current behavior |
| --- | --- | --- |
| `by_event_name` | String | Partial case-insensitive event name |
| `from_date` | `YYYY-MM-DD` | Lower bound for event start |
| `to_date` | `YYYY-MM-DD` | Upper date boundary for event end |
| `is_active` | `"true"` or `"false"` | true selects active events; false currently applies no status filter |

Send date endpoints together and enforce `from_date <= to_date` in the UI. A lone `to_date` currently leads to an invalid range. A lone `from_date` is interpreted as a single-day range.

CURRENT IS_ACTIVE DEFAULT ISSUE: the omitted parameter defaults to the STRING `"false"` after the transform. The service treats it as truthy and can send an invalid string boolean to Prisma. Temporarily send `is_active=false` explicitly for an unfiltered list, or `is_active=true` for active events. An inactive-only list is not currently supported by the service behavior.

```http
GET /upcoming_events?is_active=true&by_event_name=meeting&from_date=2026-10-24&to_date=2026-10-26&page=1&pageSize=20
```

```json
{
  "status": "success",
  "message": "All upcoming events fetched successfully",
  "data": [
    {
      "id": 9,
      "eventName": "Hostel meeting",
      "eventDescription": "Monthly residents meeting",
      "startingAt": "2026-10-24T12:30:00.000Z",
      "endingAt": "2026-10-24T13:30:00.000Z",
      "isActive": true,
      "eventImageKey": "event_image/example-key",
      "eventLink": "https://example.com/event",
      "contactPersonName": "Demo Coordinator",
      "contactPersonPhone": "9000000005",
      "createdAt": "2026-10-23T09:00:00.000Z",
      "updatedAt": "2026-10-23T09:00:00.000Z",
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

Show event name, description, image, start/end displayed in IST, active badge, optional event link, and contact name/phone. Hide `createdAt` and `updatedAt` as audit metadata. Hide absent optional links/images and avoid broken-image placeholders. A true `isActive` flag is not itself proof that the start time is in the future.

The date filter currently selects events whose start AND end fit within the selected range. It does not select every event overlapping the range. Boundaries use UTC midnight, not IST midnight, and include an event ending exactly at the next day's UTC midnight. Do not describe this filter as an exact IST-day filter until the backend changes it.

CURRENT PAGINATION LIMITATION: the service calculates page metadata, but the events repository does not apply `skip`/`take`. It returns all matching events for every page. Do not show working server-side next/previous controls for events until this is fixed; a temporary client-side view must paginate the complete returned list itself rather than append responses from repeated pages.

For create/update event forms, use UTC instants, for example:

```json
{
  "eventName": "Hostel meeting",
  "eventDescription": "Monthly residents meeting",
  "startingAt": "2026-10-24T12:30:00.000Z",
  "endingAt": "2026-10-24T13:30:00.000Z"
}
```

Validate that end is not before start in the UI; the current event schemas/services do not enforce event ordering. The input precision and timezone rules from section 2 apply to both create and partial updates.

## 8. Students list

```http
GET /students
```

| Optional parameter | Type/format | Meaning |
| --- | --- | --- |
| `by_student_name` | String | Partial case-insensitive name |
| `by_department_id` | Positive integer string | Department ID |
| `by_room_id` | Positive integer string | Room ID |
| `by_roll_number` | String | Exact roll number |

Notice that these department/room names differ from the attendance/leave query names. Use exactly the names in each endpoint's table.

```http
GET /students?by_student_name=ravi&by_department_id=2&by_room_id=3&page=1&pageSize=20
```

```json
{
  "status": "success",
  "message": "All student profiles fetched successfully",
  "data": [
    {
      "id": 12,
      "studentName": "Ravi Kumar",
      "contactNumber": "9000000001",
      "parentMobileNumber": "9000000002",
      "studentImageKey": "student_image/example-key",
      "rollNumber": "00123",
      "userId": 15,
      "departmentId": 2,
      "roomId": 3,
      "collegeId": 1,
      "hostelId": 1,
      "createdAt": "2026-10-23T09:00:00.000Z",
      "updatedAt": "2026-10-23T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

Rows are `body.data`. Show profile photo, student name, roll number, phone number, parent mobile number, department, and room. Show the actual phone numbers as well as call actions, rather than only unlabeled icons. Hide `createdAt` and `updatedAt`. `roomId` and `studentImageKey` can be null. Use `id` for student actions, not `userId`.

The list currently returns scalar student-profile fields only. It does NOT include email, account status, department name, room number, or a signed image URL. Resolve department and room labels from lookup data; do not read nonexistent `student.department` or `student.room` objects here. Do not manufacture an Active status badge for rows without status data.

Use `GET /students/departments` for department options and `GET /rooms` for room options. Both require the admin token; rooms are paginated, so fetch all needed pages when building a complete ID-to-number map. The students query has a stable ascending-ID order.

### Student details and editing

On the student details page (`GET /students/:id`), prominently show the student's image when available and all returned business details: name, roll number, phone number, parent mobile number, department, and room. The details service also adds `studentImageUrl` when an image key exists; use that signed URL when available. Resolve department and room labels through lookup data when the response only supplies IDs. Hide audit timestamps and keep technical IDs for navigation/state.

The roll number, phone number, and parent mobile number must each be editable in the UI. Use `PATCH /students/:id` and send only fields whose values actually changed:

| UI field | Payload key | Input rules | Current backend saving support |
| --- | --- | --- | --- |
| Roll number | `rollNumber` | String; preserve leading zeros; require a nonblank value in the form | Accepted by request validation, but not yet passed through the update service/repository; backend change required to persist it |
| Phone number | `contactNumber` | String containing exactly 10 digits | Supported; must be unique |
| Parent mobile number | `parentMobileNumber` | String containing exactly 10 digits | Supported |

Example desired edit payload (roll-number saving still requires the backend change described above):

```json
{
  "rollNumber": "00125",
  "contactNumber": "9000000006",
  "parentMobileNumber": "9000000007"
}
```

Use text/tel inputs, not numeric values, for these fields. The backend checks phone length; the frontend should additionally restrict phone fields to digits. Show validation/conflict errors beside the matching field. Only ACTIVE student profiles can currently be edited. Omit unchanged phone, email, department, and room values: existing uniqueness/capacity checks can reject redundant values. After saving, refetch the details and confirm the displayed values; do not claim the roll number was saved while the backend still ignores it.

Do not omit these three fields from the details page just because a shorter student list layout is used. When space is limited, keep them visible in an expanded details section rather than hiding them entirely.

## 9. Images, nullable fields, and shared UI behavior

Image fields ending in `Key` are storage object keys, not browser URLs. For a non-null key, request:

```http
GET /media/download_url?image_key=<URL-encoded-object-key>
```

The success response's `data` contains `downloadUrl` and `objectKey`. Use `data.downloadUrl` as the image source. These URLs expire (currently 5 minutes for the generic endpoint), so refresh when necessary rather than storing a signed URL permanently. Resolve visible images on demand and deduplicate repeated key lookups.

Other UI rules:

- Show all returned business fields wherever practical, using tables/cards for the main values and expandable details for secondary values. Hide audit metadata such as `createdAt` and `updatedAt`; technical IDs are for actions/state, and pagination `meta` is for navigation rather than row display.
- Business times such as attendance `reportedTime`, event start/end, review time, and payment time are not audit metadata. Show them where relevant, formatted in IST. In particular, attendance must include the “Reported at” time.
- Show student images wherever a response supplies `studentImageKey` or `studentImageUrl`: student lists/details, attendance present/absent, and leave requests. Pair images with name, roll number, department/room, and contact details when those fields are available. Do not invent unavailable fields on endpoints that do not return them.
- Render null room as “Not assigned” and null image as a profile placeholder.
- Render absent optional timestamps as “—”; do not call `new Date(null)`.
- Use phone numbers as strings and optionally provide `tel:` links.
- Show distance in meters and face match as a percentage.
- Build the map link from the returned latitude/longitude, for example `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`.
- Use separate loading, empty, and error states. Keep filters visible after an error so users can correct them.
- Status totals belong to the full matching dataset, not the currently displayed page. Do not calculate leave status cards by counting visible rows.
- Name/roll/room/department query names vary across modules; avoid one generic filter object sent unchanged to every API.

### Errors

The shared error response is:

```json
{
  "status": "failure",
  "message": "Invalid request",
  "data": null,
  "errors": {
    "by_room_id": "Too small: expected number to be >=1"
  }
}
```

The exact message varies. `errors` can be an object or a string. Use HTTP status as well as the response body; validation generally returns 422, access denial 403, missing resources 404, and business conflicts 409. Missing/malformed authentication currently may return 400, while expired/invalid JWTs return 401. Handle login expiry without retrying the same invalid token indefinitely.

## 10. Frontend handoff checklist

- Use `/hostel_admin/splash_screen` and display the three returned names.
- Read pagination directly from `body.meta`; explicitly request `pageSize=20` by default.
- Send event moments as UTC ISO strings with exactly three fractional digits.
- Send leave/bill dates and date query filters as `YYYY-MM-DD`.
- Preserve calendar dates when the response currently contains a midnight-UTC string.
- Use separate present/absent attendance row renderers and correct summary labels.
- Always show present attendance's `reportedTime` as “Reported at” in IST, along with profile/captured images when available.
- Show available business details across screens and hide `createdAt`/`updatedAt` audit metadata.
- Show editable roll number, phone number, and parent mobile number on the student details page; roll-number persistence is pending backend support.
- Add each endpoint's supported filters with the exact names documented above.
- Show leave cards from `statusesCount`, independent of the selected status tab.
- Resolve image keys through the media endpoint and allow null rooms/images.
- Keep outside-hostel filtering unavailable until fixed; account for the event active-default and pagination limitations before enabling those controls.

Backend source files reviewed: `src/app.js`, shared response/pagination/date utilities, authentication and validation middleware, and the routes, request schemas, controllers, services, repositories, and Prisma models for the modules described above. Responses are examples derived from that code; no live endpoint requests or database migrations were performed to produce this guide.
