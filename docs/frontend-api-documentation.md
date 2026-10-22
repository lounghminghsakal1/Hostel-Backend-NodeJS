# Frontend API documentation — OurHostel

Base URL: **https://api.ourhostel.in/api/v1**

Prepared: **10 October 2026**. Scope: only the paths supplied in the Flutter `ApiEndpoints` class, including all implemented HTTP methods on those paths.

This document describes the **current local source**, including existing workspace edits, rather than assuming the production deployment has identical behavior. Examples are illustrative and source-derived; no production requests or database writes were performed. Backend code was not changed.

## 1. Connection, authentication, and JSON conventions

Flutter `.env`:

```dotenv
BASE_URL=https://api.ourhostel.in/api/v1
```

Append the endpoint path once: `$baseUrl/auth/login`. Do not append another `/api/v1`. The app's route prefix is environment-configured through `API_PREFIX`; this document uses the production base URL you supplied.

For JSON request bodies:

```http
Content-Type: application/json
Accept: application/json
```

For every protected method:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

Use `data.token` from login. The header scheme must be exactly `Bearer`. Public methods are login and initial password setup. Roles are checked on the backend; a student token cannot access an admin-only endpoint.

IDs in request bodies are JSON integers, not quoted strings. URL `{id}` placeholders are positive integer resource IDs. Most ID routes only convert with `Number()` and do not validate IDs with a schema; malformed IDs may therefore lead to 500. Phone fields are strings. JSON booleans must be unquoted. Date/time response values are ISO 8601 strings; nullable fields can be null. List endpoints return empty arrays when no records match. Ordering is not guaranteed unless explicitly mentioned.

Most request schemas strip unknown body/query fields. Do not rely on unsupported query parameters to perform filtering. There is no multipart upload body on the implemented paths covered here.

### Common success response

```json
{
  "status": "success",
  "message": "Human-readable message",
  "data": {},
  "errors": null
}
```

`data` may be an object, array, or string depending on the method. Attendance listing instead returns `meta` and omits `errors`; its full example appears below.

### Common error response

```json
{
  "status": "failure",
  "message": "Invalid request",
  "data": null,
  "errors": {
    "email": "Invalid email address"
  }
}
```

Validation errors use HTTP 422 and a field-to-message object. `errors` may also be a string for other failures. Error wording is illustrative here; exact validation messages can vary.

| HTTP status | Meaning in this backend |
| --- | --- |
| 200 | Successful read or update; login also uses 200. |
| 201 | Successful creation or initial password setup. |
| 400 | Missing Authorization header, malformed Bearer header, or invalid login credentials. |
| 401 | Invalid or expired JWT. |
| 403 | Role is not authorized. |
| 404 | Resource/token/user not found where handled explicitly. |
| 409 | Business conflict such as duplicates, pending leave, full room, or invalid state. |
| 422 | Schema validation or certain business validation failures. |
| 500 | Unhandled database/service errors or implementation defects. |

A missing route normally falls through to Express's default **404 response, often HTML**, because the app has no custom JSON 404 handler. Do not assume every HTTP failure has the common JSON envelope.

## 2. Endpoint coverage

Each `{id}` corresponds to the integer argument in the Flutter helper.

| Flutter constant/helper | Relative path | Implemented methods | Access / status |
| --- | --- | --- | --- |
| login | /auth/login | POST | Public |
| setupNewPassword | /students/setup_new_password | POST | Public |
| forgotPassword | /students/forgot_password | None | Missing |
| studentHomeScreen | /students/home | GET | STUDENT |
| attendanceRecords | /attendance_records | POST, GET | POST student; GET admin |
| adminDashboard | /hostel-admin/dashboard | None | Missing; mount name also differs |
| students | /students | POST, GET | HOSTEL_ADMIN |
| studentById | /students/{id} | GET, PATCH | HOSTEL_ADMIN |
| departments | /students/departments | GET | HOSTEL_ADMIN |
| rooms | /rooms | POST, GET | HOSTEL_ADMIN; implementation issues |
| roomById | /rooms/{id} | GET, PATCH | HOSTEL_ADMIN; implementation issues |
| leaveApplications | /leave_applications | POST, GET | POST student; GET admin |
| leaveApplicationById | /leave_applications/{id} | GET, PATCH | GET admin; PATCH student |
| reviewLeaveApplication | /leave_applications/{id}/review | PATCH | HOSTEL_ADMIN |
| cancelLeaveApplication | /leave_applications/{id}/cancel | PATCH | STUDENT |
| myLeaveApplications | /leave_applications/student/my_leave_applications | None | Missing |
| myLeaveApplicationById | /leave_applications/student/my_leave_applications/{id} | None | Missing |
| upcomingEvents | /upcoming_events | POST, GET | POST admin; GET admin/student |
| upcomingEventById | /upcoming_events/{id} | GET, PATCH | GET admin/student; PATCH admin |
| mediaUploadUrl | /media/upload_url | None | Missing; only specialized media paths exist |
| mediaDownloadUrl | /media/download_url | None | Missing; only specialized media paths exist |

No DELETE method is implemented on any of these paths. Extra student status/room/activation and specialized upload endpoints are outside this requested documentation scope.

## 3. Implemented API methods

### 3.1. POST /auth/login

**URL:** `https://api.ourhostel.in/api/v1/auth/login`  
**Access:** Public  
**Success:** HTTP 200

Authenticates an existing user and returns a JWT plus basic account information.

**Query parameters:** None.

**Request fields**

`email`: required valid email string. `password`: required string; no minimum length is enforced by this schema.

**Example request payload**

```json
{
  "email": "arun@example.com",
  "password": "ExamplePassword123!"
}
```

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Logged in successful",
  "data": {
    "user": {
      "id": 25,
      "email": "arun@example.com",
      "status": "ACTIVE",
      "role": "STUDENT"
    },
    "token": "<JWT_ACCESS_TOKEN>"
  },
  "errors": null
}
```

**Behavior and integration notes**

The token expires after **1 day**. Roles are `STUDENT` or `HOSTEL_ADMIN`. Invalid email/password credentials return 400. The response does not contain a student profile ID or hostel ID. Login does not explicitly reject inactive/suspended users. A user without a password hash may hit a bcrypt error rather than the normal invalid-credentials response.

### 3.2. POST /students/setup_new_password

**URL:** `https://api.ourhostel.in/api/v1/students/setup_new_password`  
**Access:** Public  
**Success:** HTTP 201

Sets the initial password using the token from an emailed account activation link.

**Query parameters:** None.

**Request fields**

`token` and `newPassword`: required strings. No password-strength, minimum-length, or confirmation field is enforced by the backend.

**Example request payload**

```json
{
  "token": "<RAW_TOKEN_FROM_EMAIL_LINK>",
  "newPassword": "ExamplePassword123!"
}
```

**Example response — HTTP 201**

```json
{
  "status": "success",
  "message": "New password set successfully",
  "data": "Password updated successfully, now login with new password",
  "errors": null
}
```

**Behavior and integration notes**

Extract `token` from `ourhostel://setup-password?token=...`; send the raw token, not its hash. The account must be `PENDING_ACTIVATION`. Generated setup tokens expire after **5 minutes** and are single use. Success activates the account; it does not return a JWT, so call login next. Unknown token/user: 404. Expired/used token or wrong account status: 422. This is an initial setup API, not a general password reset API.

### 3.3. GET /students/home

**URL:** `https://api.ourhostel.in/api/v1/students/home`  
**Access:** STUDENT  
**Success:** HTTP 200

Returns the attendance button flag and announcement data for the signed-in student.

**Query parameters:** None.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Student home screen data fetched successfully",
  "data": {
    "canMarkAttendance": true,
    "announcementsData": []
  },
  "errors": null
}
```

**Behavior and integration notes**

**Current implementation:** `announcementsData` is always an empty array. Outside the configured attendance window, `canMarkAttendance` is still true due to a testing override. Inside the window, it becomes false if today's record exists. Treat this flag as the returned UI hint, not a guarantee that attendance requirements are enforced.

### 3.4. POST /attendance_records

**URL:** `https://api.ourhostel.in/api/v1/attendance_records`  
**Access:** STUDENT  
**Success:** HTTP 201

Creates today's attendance record for the signed-in student using an uploaded capture and location.

**Query parameters:** None.

**Request fields**

`capturedImageKey`: required string identifying an uploaded object. `latitude`: required JSON number between -90 and 90. `longitude`: required JSON number between -180 and 180. The student ID and attendance date are determined by the backend.

**Example request payload**

```json
{
  "capturedImageKey": "attendance/captures/example.jpg",
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

**Example response — HTTP 201**

```json
{
  "status": "success",
  "message": "Attendance marked as present successfully",
  "data": {
    "id": 101,
    "attendanceDate": "2026-10-10T00:00:00.000Z",
    "reportedTime": "2026-10-10T15:15:00.000Z",
    "capturedImageKey": "attendance/captures/example.jpg",
    "faceMatchingPercentage": 96.4,
    "latitude": 13.0827,
    "longitude": 80.2707,
    "isLocatedWithinHostelRadius": true,
    "locationDeviationFromHostel": 42.6,
    "studentId": 12
  },
  "errors": null
}
```

**Behavior and integration notes**

Upload the image before submitting its object key. The student must already have a profile image (otherwise 409). The server calls its face verification service and calculates location distance in **meters**. **Current behavior:** attendance-window checks are commented out; a low match or location outside the radius does not reject the submission. A database uniqueness constraint allows one record per student per date; duplicate submission is not translated into a dedicated 409 and may return 500. Face service failures may also return 500. The generic media upload path in your Flutter constants is missing; see the media sections.

### 3.5. GET /attendance_records

**URL:** `https://api.ourhostel.in/api/v1/attendance_records`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Lists attendance for the admin's hostel, with a summary and pagination. Present and absent filters return different row shapes.

**Query parameters:** 

| Parameter | Type | Default | Meaning |
| --- | --- | --- | --- |
| page | integer string | 1 | Page number, minimum 1. |
| pageSize | integer string | 10 | Rows per page, minimum 1, maximum 100. |
| date | YYYY-MM-DD string | Today's Asia/Kolkata date if no date filters | Single calendar date. |
| fromDate | YYYY-MM-DD string | None | First date of an inclusive range; requires toDate. |
| toDate | YYYY-MM-DD string | None | Last date of an inclusive range; requires fromDate. |
| status | string | present | Exactly `present` or `absent` (lowercase). |

Use either `date` or both `fromDate` and `toDate`. Mixing them, providing only one range bound, or setting fromDate after toDate returns 422.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Attendance records fetched successfully",
  "data": {
    "summary": {
      "totalStudentsOfTheHostel": 100,
      "totalStudentsWithatleastOnePresentDuringDateFilter": 92,
      "completelyAbsentStudentsCountDuringDates": 8
    },
    "attendanceRecords": [
      {
        "id": 101,
        "attendanceDate": "2026-10-10T00:00:00.000Z",
        "reportedTime": "2026-10-10T15:15:00.000Z",
        "capturedImageKey": "attendance/captures/example.jpg",
        "faceMatchingPercentage": 96.4,
        "latitude": 13.0827,
        "longitude": 80.2707,
        "isLocatedWithinHostelRadius": true,
        "locationDeviationFromHostel": 42.6,
        "studentId": 12,
        "student": {
          "studentName": "Arun Kumar",
          "rollNumber": "CSE2026001",
          "studentImageKey": "students/12.jpg",
          "room": {
            "roomNumber": "A-101"
          }
        }
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

**Behavior and integration notes**

Example request: `/attendance_records?date=2026-10-10&status=present&page=1&pageSize=10`.

For a range: `/attendance_records?fromDate=2026-10-01&toDate=2026-10-10&status=absent&page=1&pageSize=10`.

`totalStudentsWithatleastOnePresentDuringDateFilter` counts distinct students with at least one record in the selected dates. `completelyAbsentStudentsCountDuringDates` counts students with no records across the entire range. An absent-list row means a student missed **at least one** selected date, so absent row count can differ from that summary count. Present pagination counts attendance records; absent pagination counts students. `meta` contains only `page`, `pageSize`, and `totalPages` (at least 1), with no total count. Ordering is not explicitly defined. See the additional absent example below.

**Additional example response — `status=absent`**

```json
{
  "status": "success",
  "message": "Attendance records fetched successfully",
  "data": {
    "summary": {
      "totalStudentsOfTheHostel": 100,
      "totalStudentsWithatleastOnePresentDuringDateFilter": 92,
      "completelyAbsentStudentsCountDuringDates": 8
    },
    "attendanceRecords": [
      {
        "studentName": "Arun Kumar",
        "rollNumber": "CSE2026001",
        "contactNumber": "9876543210",
        "roomNumber": "A-101",
        "department": "Computer Science",
        "parentMobileNumber": "9876543211",
        "studentImageKey": "students/12.jpg",
        "absentDates": [
          "2026-10-10"
        ]
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

Absent rows have no attendance record ID, captured image, face match, or coordinates. They include contact details, department name, and an array of absent dates. The repository intends a nullable roomNumber, but accesses `student.room.roomNumber` without guarding a null room; an unassigned student can currently cause a 500.

### 3.6. POST /students

**URL:** `https://api.ourhostel.in/api/v1/students`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 201

Creates the user and student profile in the admin's hostel/college, then emails a setup link.

**Query parameters:** None.

**Request fields**

| Field | Type | Required on create | Meaning / validation |
| --- | --- | --- | --- |
| email | string | Yes | Valid email address; stored on the user account. |
| studentName | string | Yes | Student's display name. |
| contactNumber | string | Yes | Exactly 10 characters; globally unique. Validation does not enforce digits only. |
| parentMobileNumber | string | Yes | Exactly 10 characters; validation does not enforce digits only. |
| departmentId | integer | Yes | Positive department ID belonging to the admin's college. |
| rollNumber | string | Yes | Unique within the hostel at database level. |
| studentImageKey | string | No | Stored S3 object key, not a signed URL. Omitted on create means null. |
| roomId | integer | No | Positive room ID in the admin's hostel with available capacity. Omitted on create means null. |

**Example request payload**

```json
{
  "email": "arun@example.com",
  "studentName": "Arun Kumar",
  "contactNumber": "9876543210",
  "parentMobileNumber": "9876543211",
  "departmentId": 3,
  "rollNumber": "CSE2026001",
  "studentImageKey": "students/12.jpg",
  "roomId": 7
}
```

**Example response — HTTP 201**

```json
{
  "status": "success",
  "message": "Student created successfully",
  "data": {
    "id": 12,
    "studentName": "Arun Kumar",
    "contactNumber": "9876543210",
    "parentMobileNumber": "9876543211",
    "studentImageKey": "students/12.jpg",
    "rollNumber": "CSE2026001",
    "userId": 25,
    "departmentId": 3,
    "roomId": 7,
    "collegeId": 1,
    "hostelId": 2,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z"
  },
  "errors": null
}
```

**Behavior and integration notes**

Only the profile is returned, not the account/email or activation token. Setup link lifetime: 5 minutes. Duplicate email/contact: 409. Invalid department/hostel/room: 404. Full room or mismatched scope: 409. Duplicate roll number is enforced by the database but is not mapped to a specific HTTP conflict. Email is sent after the database transaction commits, so an email failure can return an error even when the profile was created.

### 3.7. GET /students

**URL:** `https://api.ourhostel.in/api/v1/students`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Lists student profiles within the admin's hostel and college.

**Query parameters:** None.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "All student profiles fetched successfully",
  "data": [
    {
      "id": 12,
      "studentName": "Arun Kumar",
      "contactNumber": "9876543210",
      "parentMobileNumber": "9876543211",
      "studentImageKey": "students/12.jpg",
      "rollNumber": "CSE2026001",
      "userId": 25,
      "departmentId": 3,
      "roomId": 7,
      "collegeId": 1,
      "hostelId": 2,
      "createdAt": "2026-10-10T10:00:00.000Z",
      "updatedAt": "2026-10-10T10:00:00.000Z"
    }
  ],
  "errors": null
}
```

**Behavior and integration notes**

Unpaginated; an empty result is `data: []`. Does not join email, user status, department name, room number, or signed image URLs. There are no implemented search/sort/filter query parameters.

### 3.8. GET /students/{id}

**URL:** `https://api.ourhostel.in/api/v1/students/{id}`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Fetches one student profile within the admin's hostel and college, including a signed profile-image URL.

**Query parameters:** None.

**Request fields**

No request body. `id` is a student **profile** ID, not a user ID.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Student fetched successfully",
  "data": {
    "id": 12,
    "studentName": "Arun Kumar",
    "contactNumber": "9876543210",
    "parentMobileNumber": "9876543211",
    "studentImageKey": "students/12.jpg",
    "rollNumber": "CSE2026001",
    "userId": 25,
    "departmentId": 3,
    "roomId": 7,
    "collegeId": 1,
    "hostelId": 2,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z",
    "studentImageUrl": "https://example-bucket.s3.amazonaws.com/students/12.jpg?<SIGNED_QUERY>"
  },
  "errors": null
}
```

**Behavior and integration notes**

Unknown or out-of-scope profile: 404. `studentImageUrl` is null if no image key exists. The signing helper currently hardcodes **300 seconds** even though this service requests 3600 seconds. Refresh by fetching the profile again. Email and user status are not included.

### 3.9. PATCH /students/{id}

**URL:** `https://api.ourhostel.in/api/v1/students/{id}`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Partially updates an existing active student profile and optionally the associated account email.

**Query parameters:** None.

**Request fields**

All fields in the student-create table are optional and retain their type constraints. Omit unchanged fields. Null is not accepted by the schemas. **Although `rollNumber` is accepted by validation, it is not applied by the service/repository.**

**Example request payload**

```json
{
  "studentName": "Arun K",
  "parentMobileNumber": "9876543213",
  "departmentId": 3,
  "roomId": 7
}
```

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Student updated successfully",
  "data": {
    "id": 12,
    "studentName": "Arun K",
    "contactNumber": "9876543210",
    "parentMobileNumber": "9876543213",
    "studentImageKey": "students/12.jpg",
    "rollNumber": "CSE2026001",
    "userId": 25,
    "departmentId": 3,
    "roomId": 7,
    "collegeId": 1,
    "hostelId": 2,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z"
  },
  "errors": null
}
```

**Behavior and integration notes**

Requires the associated account status to be `ACTIVE`; otherwise 409. Profile not found: 404. Email/contact uniqueness checks do not exclude the current student, so resending the existing email or contact can return 409. Room checks include capacity even when the room is unchanged. The response is just the profile; updated email is not returned. Use omission rather than null to leave fields unchanged; clearing room/image to null is unsupported.

### 3.10. GET /students/departments

**URL:** `https://api.ourhostel.in/api/v1/students/departments`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Lists departments in the admin's college for department selectors.

**Query parameters:** None.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Departments fetched successfully",
  "data": [
    {
      "id": 3,
      "departmentName": "Computer Science",
      "hodName": "Dr. Meena",
      "contactPersonName": "Priya",
      "contactNumber": "9876543214",
      "collegeId": 1
    }
  ],
  "errors": null
}
```

**Behavior and integration notes**

Unpaginated; no search or filter parameters. Empty result: `data: []`.

### 3.11. POST /rooms

**URL:** `https://api.ourhostel.in/api/v1/rooms`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 201

Intended to create a room with a unique room number within the admin's hostel.

**Query parameters:** None.

**Request fields**

`roomNumber`: required string. `capacity`: required positive JSON integer.

**Example request payload**

```json
{
  "roomNumber": "A-101",
  "capacity": 4
}
```

**Example response — HTTP 201**

```json
{
  "status": "success",
  "message": "Room created successfully",
  "data": {
    "id": 7,
    "roomNumber": "A-101",
    "capacity": 4,
    "hostelId": 2,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z"
  },
  "errors": null
}
```

**Behavior and integration notes**

**Implementation blocker:** the room service reads `accessContext.loggedAdminHostelId`, but the helper provides `loggedInAdminHostelId`. The missing value can cause creation to fail because hostelId is required. The example below is the configured success shape if creation succeeds; do not treat it as a verified successful runtime result. Intended duplicate room number error: 409.

### 3.12. GET /rooms

**URL:** `https://api.ourhostel.in/api/v1/rooms`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Returns room numbers, capacity, and derived occupancy for room selection.

**Query parameters:** 

| Parameter | Declared type | Actual behavior |
| --- | --- | --- |
| starts_with | string, optional | Passes validation, but the service ignores it. No prefix filtering occurs. |
| only_vacancy | boolean, optional | Schema expects an actual boolean, but ordinary URL query values such as `true` are strings and return 422. It is also ignored by the service. |

No working vacancy or prefix filter is implemented. Omit these fields and filter the returned list in the frontend only after backend scoping is corrected.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "All rooms fetched successfully",
  "data": [
    {
      "id": 7,
      "roomNumber": "A-101",
      "capacity": 4,
      "hostelId": 2,
      "occupied": 2,
      "remaining": 2
    }
  ],
  "errors": null
}
```

**Behavior and integration notes**

`occupied` counts assigned student profiles; `remaining = capacity - occupied`. No pagination or timestamps are returned. **Scope issue:** the room service uses the wrong access-context property (`loggedAdminHostelId`), so the hostel filter may be omitted and records may span hostels. The query fields below are declared but are not used to filter results.

### 3.13. GET /rooms/{id}

**URL:** `https://api.ourhostel.in/api/v1/rooms/{id}`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Fetches a room and its assigned-student count.

**Query parameters:** None.

**Request fields**

No request body. `id` is the room ID.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Room fetched successfully",
  "data": {
    "id": 7,
    "roomNumber": "A-101",
    "capacity": 4,
    "hostelId": 2,
    "_count": {
      "studentProfiles": 2
    }
  },
  "errors": null
}
```

**Behavior and integration notes**

The detail response has `_count.studentProfiles`, unlike the list's `occupied` and `remaining`. Compute remaining as `capacity - _count.studentProfiles`. Room not found: 404. The same access-context property mismatch affects hostel scoping.

### 3.14. PATCH /rooms/{id}

**URL:** `https://api.ourhostel.in/api/v1/rooms/{id}`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Partially updates a room number or capacity.

**Query parameters:** None.

**Request fields**

`roomNumber`: optional string. `capacity`: optional positive JSON integer.

**Example request payload**

```json
{
  "capacity": 5
}
```

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Room updated successfully",
  "data": {
    "id": 7,
    "roomNumber": "A-101",
    "capacity": 5,
    "hostelId": 2,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z"
  },
  "errors": null
}
```

**Behavior and integration notes**

Room not found: 404. Duplicate room number, unchanged capacity, or capacity below existing occupancy: 409. Resending the same room number may conflict because the repository does not exclude the current room. Response contains timestamps but no occupancy fields. The access-context property mismatch affects hostel scoping.

### 3.15. POST /leave_applications

**URL:** `https://api.ourhostel.in/api/v1/leave_applications`  
**Access:** STUDENT  
**Success:** HTTP 201

Creates a leave request for the signed-in student.

**Query parameters:** None.

**Request fields**

`leaveReason`: required string. `fromDate` and `toDate`: required date-convertible values; send ISO 8601 strings. Creation requires fromDate <= toDate; invalid ordering returns 422. Student ID and status are server assigned.

**Example request payload**

```json
{
  "leaveReason": "Family function",
  "fromDate": "2026-10-15T00:00:00.000Z",
  "toDate": "2026-10-17T00:00:00.000Z"
}
```

**Example response — HTTP 201**

```json
{
  "status": "success",
  "message": "Leave application created successfully",
  "data": {
    "id": 31,
    "leaveReason": "Family function",
    "fromDate": "2026-10-15T00:00:00.000Z",
    "toDate": "2026-10-17T00:00:00.000Z",
    "status": "WAITING_FOR_APPROVAL",
    "rejectionReason": null,
    "studentId": 12,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z",
    "reviewedAt": null
  },
  "errors": null
}
```

**Behavior and integration notes**

New status is `WAITING_FOR_APPROVAL`. A student may have only one pending request (409 if one exists). Overlapping approved leave dates are rejected with 409, including shared date boundaries. No explicit future-date requirement is enforced.

### 3.16. GET /leave_applications

**URL:** `https://api.ourhostel.in/api/v1/leave_applications`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Lists leave applications from students in the admin's hostel.

**Query parameters:** None.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "All leave applications fetched successfully",
  "data": [
    {
      "id": 31,
      "leaveReason": "Family function",
      "fromDate": "2026-10-15T00:00:00.000Z",
      "toDate": "2026-10-17T00:00:00.000Z",
      "status": "WAITING_FOR_APPROVAL",
      "rejectionReason": null,
      "studentId": 12,
      "createdAt": "2026-10-10T10:00:00.000Z",
      "updatedAt": "2026-10-10T10:00:00.000Z",
      "reviewedAt": null
    }
  ],
  "errors": null
}
```

**Behavior and integration notes**

Unpaginated, with no status/date/search filters. Returns all statuses and raw application fields, without student names, room details, or joined student profiles.

### 3.17. GET /leave_applications/{id}

**URL:** `https://api.ourhostel.in/api/v1/leave_applications/{id}`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Fetches a specific application in the admin's hostel.

**Query parameters:** None.

**Request fields**

No request body. `id` is a leave application ID.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Leave application fetched successfully",
  "data": {
    "id": 31,
    "leaveReason": "Family function",
    "fromDate": "2026-10-15T00:00:00.000Z",
    "toDate": "2026-10-17T00:00:00.000Z",
    "status": "WAITING_FOR_APPROVAL",
    "rejectionReason": null,
    "studentId": 12,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z",
    "reviewedAt": null
  },
  "errors": null
}
```

**Behavior and integration notes**

Not found or outside the admin's hostel: 404. Students cannot call this GET route (403); the requested student-specific GET paths are absent.

### 3.18. PATCH /leave_applications/{id}

**URL:** `https://api.ourhostel.in/api/v1/leave_applications/{id}`  
**Access:** STUDENT  
**Success:** HTTP 200

Edits a pending leave application.

**Query parameters:** None.

**Request fields**

`leaveReason`: optional string. `fromDate` and `toDate`: optional date-convertible values, but both must be supplied together when changing dates (otherwise 409). Null is not a supported clearing value.

**Example request payload**

```json
{
  "leaveReason": "Updated family travel",
  "fromDate": "2026-10-16T00:00:00.000Z",
  "toDate": "2026-10-18T00:00:00.000Z"
}
```

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Leave application updated successfully",
  "data": {
    "id": 31,
    "leaveReason": "Updated family travel",
    "fromDate": "2026-10-16T00:00:00.000Z",
    "toDate": "2026-10-18T00:00:00.000Z",
    "status": "WAITING_FOR_APPROVAL",
    "rejectionReason": null,
    "studentId": 12,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z",
    "reviewedAt": null
  },
  "errors": null
}
```

**Behavior and integration notes**

Only `WAITING_FOR_APPROVAL` applications can be edited (409 otherwise). Unknown/out-of-hostel ID: 404. Approved-date overlap: 409. **Current limitations:** update does not check fromDate <= toDate; validate that in the UI. A reason-only update can be rejected whenever the student has any approved leave because the overlap query omits dates. The target lookup checks hostel membership, not ownership by the signed-in student; this requires a backend fix.

### 3.19. PATCH /leave_applications/{id}/review

**URL:** `https://api.ourhostel.in/api/v1/leave_applications/{id}/review`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Approves or rejects a pending application in the admin's hostel.

**Query parameters:** None.

**Request fields**

`status`: required, exactly `APPROVED` or `REJECTED`. `rejectionReason`: optional string in the schema, but required and non-empty by the service when rejecting.

**Example request payload**

```json
{
  "status": "REJECTED",
  "rejectionReason": "Examinations are scheduled during these dates."
}
```

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Leave application reviewed successfully",
  "data": {
    "id": 31,
    "leaveReason": "Family function",
    "fromDate": "2026-10-15T00:00:00.000Z",
    "toDate": "2026-10-17T00:00:00.000Z",
    "status": "REJECTED",
    "rejectionReason": "Examinations are scheduled during these dates.",
    "studentId": 12,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z",
    "reviewedAt": null
  },
  "errors": null
}
```

**Behavior and integration notes**

To approve, send `{"status":"APPROVED"}`. Only pending applications can be reviewed (409 otherwise); rejecting without a reason returns 422. `reviewedAt` is not updated and can remain null after a review. The intended missing-ID 404 branch references an undefined `id`, so an unknown/out-of-scope application can currently return 500.

### 3.20. PATCH /leave_applications/{id}/cancel

**URL:** `https://api.ourhostel.in/api/v1/leave_applications/{id}/cancel`  
**Access:** STUDENT  
**Success:** HTTP 200

Cancels a pending leave application.

**Query parameters:** None.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Leave application cancelled successfully",
  "data": {
    "id": 31,
    "leaveReason": "Family function",
    "fromDate": "2026-10-15T00:00:00.000Z",
    "toDate": "2026-10-17T00:00:00.000Z",
    "status": "CANCELLED",
    "rejectionReason": null,
    "studentId": 12,
    "createdAt": "2026-10-10T10:00:00.000Z",
    "updatedAt": "2026-10-10T10:00:00.000Z",
    "reviewedAt": null
  },
  "errors": null
}
```

**Behavior and integration notes**

Only `WAITING_FOR_APPROVAL` can be cancelled; approved/rejected/cancelled requests return 409. Unknown/out-of-hostel ID: 404. The service checks hostel membership but does not enforce ownership of the application; the repository receives studentId but does not use it. Frontend should only expose cancel for the user's own applications, and backend ownership enforcement still needs fixing.

### 3.21. POST /upcoming_events

**URL:** `https://api.ourhostel.in/api/v1/upcoming_events`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 201

Creates an event for the admin's hostel.

**Query parameters:** None.

**Request fields**

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| eventName | string | Yes | Event title. |
| eventDescription | string | Yes | Event description. |
| startingAt | string | Yes | UTC ISO datetime, e.g. `2026-10-20T03:30:00.000Z`. |
| endingAt | date-convertible value | Yes | Send a UTC ISO datetime string. |
| eventImageKey | string | No | Uploaded image's object key. |
| eventLink | string | No | Valid absolute URL. |
| contactPersonName | string | No | Contact person's name. |
| contactPersonPhone | string | No | Phone string; no length/digit constraint. |

**Example request payload**

```json
{
  "eventName": "Hostel sports day",
  "eventDescription": "Annual sports activities for hostel residents.",
  "startingAt": "2026-10-20T03:30:00.000Z",
  "endingAt": "2026-10-20T12:30:00.000Z",
  "eventImageKey": "events/sports-day.jpg",
  "eventLink": "https://ourhostel.in/events/sports-day",
  "contactPersonName": "Ravi",
  "contactPersonPhone": "9876543212"
}
```

**Example response — HTTP 201**

```json
{
  "status": "success",
  "message": "Upcoming event created successfully",
  "data": {
    "id": 9,
    "eventName": "Hostel sports day",
    "eventDescription": "Annual sports activities for hostel residents.",
    "startingAt": "2026-10-20T03:30:00.000Z",
    "endingAt": "2026-10-20T12:30:00.000Z",
    "isActive": true,
    "eventImageKey": "events/sports-day.jpg",
    "eventLink": "https://ourhostel.in/events/sports-day",
    "contactPersonName": "Ravi",
    "contactPersonPhone": "9876543212",
    "hostelId": 2
  },
  "errors": null
}
```

**Behavior and integration notes**

Hostel ID is inferred from the admin; `isActive` defaults to true. Optional values omitted on creation are stored as null. No start-before-end validation is implemented. No createdAt/updatedAt fields exist on the event model.

### 3.22. GET /upcoming_events

**URL:** `https://api.ourhostel.in/api/v1/upcoming_events`  
**Access:** HOSTEL_ADMIN or STUDENT  
**Success:** HTTP 200

Lists events for the signed-in user's hostel.

**Query parameters:** None.

**Request fields**

No request body.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "All upcoming events fetched successfully",
  "data": [
    {
      "id": 9,
      "eventName": "Hostel sports day",
      "eventDescription": "Annual sports activities for hostel residents.",
      "startingAt": "2026-10-20T03:30:00.000Z",
      "endingAt": "2026-10-20T12:30:00.000Z",
      "isActive": true,
      "eventImageKey": "events/sports-day.jpg",
      "eventLink": "https://ourhostel.in/events/sports-day",
      "contactPersonName": "Ravi",
      "contactPersonPhone": "9876543212",
      "hostelId": 2
    }
  ],
  "errors": null
}
```

**Behavior and integration notes**

Unpaginated; no supported date, active-status, search, or sorting parameters. Despite the route name, the query includes inactive and past events too. Filter dates and `isActive` in the frontend as needed. Image keys are returned, not signed image URLs.

### 3.23. GET /upcoming_events/{id}

**URL:** `https://api.ourhostel.in/api/v1/upcoming_events/{id}`  
**Access:** HOSTEL_ADMIN or STUDENT  
**Success:** HTTP 200

Fetches one event by ID.

**Query parameters:** None.

**Request fields**

No request body. `id` is an event ID.

**Example request payload**

None. Send no body.

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Upcoming event fetched successfully",
  "data": {
    "id": 9,
    "eventName": "Hostel sports day",
    "eventDescription": "Annual sports activities for hostel residents.",
    "startingAt": "2026-10-20T03:30:00.000Z",
    "endingAt": "2026-10-20T12:30:00.000Z",
    "isActive": true,
    "eventImageKey": "events/sports-day.jpg",
    "eventLink": "https://ourhostel.in/events/sports-day",
    "contactPersonName": "Ravi",
    "contactPersonPhone": "9876543212",
    "hostelId": 2
  },
  "errors": null
}
```

**Behavior and integration notes**

Unknown ID: 404. **Current scope limitation:** retrieval uses only the event ID and does not check the signed-in user's hostel.

### 3.24. PATCH /upcoming_events/{id}

**URL:** `https://api.ourhostel.in/api/v1/upcoming_events/{id}`  
**Access:** HOSTEL_ADMIN  
**Success:** HTTP 200

Partially updates an event; set isActive false to hide it in the frontend.

**Query parameters:** None.

**Request fields**

All create fields are optional with the same type constraints. Additional field: `isActive`, optional JSON boolean. Null is not supported for clearing optional fields.

**Example request payload**

```json
{
  "eventDescription": "Updated sports schedule.",
  "isActive": false
}
```

**Example response — HTTP 200**

```json
{
  "status": "success",
  "message": "Upcoming event updated",
  "data": {
    "id": 9,
    "eventName": "Hostel sports day",
    "eventDescription": "Updated sports schedule.",
    "startingAt": "2026-10-20T03:30:00.000Z",
    "endingAt": "2026-10-20T12:30:00.000Z",
    "isActive": false,
    "eventImageKey": "events/sports-day.jpg",
    "eventLink": "https://ourhostel.in/events/sports-day",
    "contactPersonName": "Ravi",
    "contactPersonPhone": "9876543212",
    "hostelId": 2
  },
  "errors": null
}
```

**Behavior and integration notes**

Unknown ID: 404. This update does not validate hostel ownership. There is no DELETE method; deactivation uses this PATCH. No start-before-end validation is implemented.

## 4. Requested paths missing from this checkout

These entries are retained because they appear in the supplied Flutter constants. **There is no implemented contract to document for these exact paths.** Do not use invented payloads or success responses. HTTP method, authorization, supported payload fields, and success shape remain undefined unless noted as an intended frontend use.

### 4.1. /students/forgot_password

**URL:** `https://api.ourhostel.in/api/v1/students/forgot_password`

Intended frontend purpose: email a password reset link to a registered address.

No forgot-password route, controller, service, or request schema exists. There are no supported query parameters or confirmed payload/success examples. Do not assume `{"email":"arun@example.com"}` works. A POST currently falls through to 404. A GET can match the admin-only `/students/:id` route and treat `forgot_password` as an invalid ID, producing an auth/role/database error instead of a clean missing-route response. Initial setup cannot reset an already-active user's password.

### 4.2. /hostel-admin/dashboard

**URL:** `https://api.ourhostel.in/api/v1/hostel-admin/dashboard`

Intended frontend purpose: admin dashboard totals and overview.

There is no dashboard implementation. The backend mounts an **empty** hostel-admin router at `/hostel_admins`, with an underscore and plural name, rather than `/hostel-admin`. Merely changing the Flutter spelling will not provide a dashboard. Payload, response, role contract, and query parameters are undefined. Requests to the supplied path fall through to 404.

### 4.3. /leave_applications/student/my_leave_applications

**URL:** `https://api.ourhostel.in/api/v1/leave_applications/student/my_leave_applications`

Intended frontend purpose: list the signed-in student's own applications.

No route exists. No payload or success example, filters, pagination, or confirmed authorization contract is available. A GET falls through to 404. The existing GET `/leave_applications` is admin-only and cannot serve as the student's own list.

### 4.4. /leave_applications/student/my_leave_applications/{id}

**URL:** `https://api.ourhostel.in/api/v1/leave_applications/student/my_leave_applications/31`

Intended frontend purpose: retrieve a specific application belonging to the signed-in student.

No route exists. Payload, success response, query parameters, and authorization contract are undefined. A GET falls through to 404. Existing GET `/leave_applications/{id}` is admin-only.

### 4.5. /media/upload_url

**URL:** `https://api.ourhostel.in/api/v1/media/upload_url`

Intended frontend purpose: obtain an S3 presigned PUT URL and object key based on `media_for`.

No generic route exists. `media_for` is **not supported**, and this checkout has no corresponding enum/query mapping for the proposed generic endpoint. No valid payload or success response can be given for this exact path. A GET falls through to 404.

Specialized media routes exist elsewhere in this source, but are not the requested endpoint. They use `uploadURL` (uppercase URL) and `objectKey`, with 300-second upload signatures. The frontend's generic upload flow requires a backend implementation or an explicit endpoint migration.

### 4.6. /media/download_url

**URL:** `https://api.ourhostel.in/api/v1/media/download_url`

Intended frontend purpose: obtain an S3 presigned GET URL for `image_key`.

No generic route exists. `image_key` is **not a supported parameter on this path**; no valid payload or success response is defined. A GET falls through to 404. A specialized attendance-download route uses the different spelling `imageKey`, but that route is outside this document's requested scope. Do not assume generic download response field names from the specialized handlers.

## 5. Frontend integration flows and backend dependencies

### Login and initial activation

1. A hostel admin creates a student with POST `/students`.
2. The student receives an activation deep link; the Flutter app extracts its token.
3. The app sends token and newPassword to POST `/students/setup_new_password`.
4. On success, the student logs in with POST `/auth/login`.
5. Store `data.token` and send it as the Bearer token on protected requests. Use `data.user.role` for role-specific navigation.
6. Forgot-password UI cannot be completed with this checkout's APIs; the listed reset endpoint needs implementation.

### Attendance

1. GET `/students/home` for the attendance UI flag.
2. Obtain a capture-upload URL, PUT the JPEG bytes to S3, then submit its object key and numeric coordinates to POST `/attendance_records`.
3. Admin views use GET `/attendance_records` with date/range, status, and pagination.
4. The listed generic media routes are absent, so the upload step cannot use the supplied Flutter constants yet.

For an implemented presigned S3 PUT flow, send raw file bytes to the signed URL rather than JSON or multipart data. The specialized source sets Content-Type to `image/jpeg`; use the matching content type. Do not send the backend Bearer token to S3. Persist the object key, and fetch new signatures when URLs expire. This explains the existing media design; it is not a contract for the missing generic route.

### Leave applications

1. Student creates a leave request with POST `/leave_applications`.
2. Pending requests can be updated or cancelled.
3. Admin lists and reviews pending applications.
4. Statuses are `WAITING_FOR_APPROVAL`, `APPROVED`, `REJECTED`, and `CANCELLED`. Treat them as exact uppercase enum strings.
5. The student's own list/detail endpoints must be implemented before the corresponding frontend screens can retrieve their records.

### Issues affecting integration

| Area | Current source behavior | Consequence |
| --- | --- | --- |
| Endpoint parity | Six supplied paths are missing (counting student list/detail separately). | Reset, dashboard, own leave retrieval, and generic media workflows cannot use the supplied constants. |
| Room scope | All room services read an access-context property that the helper does not provide. | Creation can fail; reads/updates can lose hostel scoping. Backend correction needed before relying on room isolation. |
| Room filters | starts_with is ignored; ordinary only_vacancy query strings fail boolean validation and are ignored even if parsed. | No working server-side prefix/vacancy filter. |
| Attendance enforcement | Time restrictions are disabled; outside-radius and low-face-match results still create records. | A success response records attendance rather than proving all checks passed. |
| Student home | Outside-window flag is true; announcements are always empty. | Returned data does not yet implement the intended home-screen behavior. |
| Leave ownership | Student edit/cancel validates hostel membership, not individual ownership. | Backend must enforce ownership; hiding controls in the frontend is insufficient. |
| Leave review | Missing application branch references an undefined variable; reviewedAt is not set. | Missing IDs may return 500; reviewed timestamp may remain null. |
| Leave edits | Reversed dates are not checked; reason-only updates can conflict with any approved leave. | Validate date order in UI and account for current 409 behavior. |
| Events | List includes inactive/past events; detail and update do not check hostel membership. | UI filters are needed; backend scope checks also need correction. |
| Student images | Signing helper uses 300 seconds regardless of caller's requested expiry. | Expect short-lived URLs and refresh them. |
| Errors | Unhandled Prisma/other errors generally map to 500; missing routes may return HTML. | Parse error bodies defensively and avoid assuming every duplicate yields 409. |

## 6. Source references

Contracts were checked against:

- [Route mounts](../src/app.js)
- [Authentication](../src/middlewares/authentication.middleware.js), [authorization](../src/middlewares/authorization.middleware.js), [validation](../src/middlewares/validate-request.middleware.js)
- [Response envelopes](../src/utils/responses.utils.js), [pagination](../src/utils/pagination.utils.js), [access context and image signing](../src/utils/helper-functions.utils.js), [date helpers](../src/utils/dates.utils.js)
- [Database models and enum values](../prisma/schema.prisma)
- Auth: [routes](../src/modules/auth/auth.routes.js), [schema](../src/modules/auth/auth.request-schema.js), [controller](../src/modules/auth/auth.controller.js), [service](../src/modules/auth/auth.service.js)
- Students: [routes](../src/modules/students/student.routes.js), [schema](../src/modules/students/student.request-schema.js), [controller](../src/modules/students/student.controller.js), [service](../src/modules/students/student.service.js), [repository](../src/modules/students/student.repository.js)
- Rooms: [routes](../src/modules/rooms/room.routes.js), [schema](../src/modules/rooms/room.request-schema.js), [controller](../src/modules/rooms/room.controller.js), [service](../src/modules/rooms/room.service.js), [repository](../src/modules/rooms/room.repository.js)
- Attendance: [routes](../src/modules/attendance-records/attndr.routes.js), [schema](../src/modules/attendance-records/attndr.request-schema.js), [controller](../src/modules/attendance-records/attndr.controller.js), [service](../src/modules/attendance-records/attndr.service.js), [repository](../src/modules/attendance-records/attndr.repository.js)
- Leave: [routes](../src/modules/leave-applications/leave-appln.routes.js), [schema](../src/modules/leave-applications/leave-appln.request-schema.js), [controller](../src/modules/leave-applications/leave-appln.controller.js), [service](../src/modules/leave-applications/leave-appln.service.js), [repository](../src/modules/leave-applications/leave-appln.repository.js)
- Events: [routes](../src/modules/upcoming-events/upcoming-events.routes.js), [schema](../src/modules/upcoming-events/upcoming-event.request-schema.js), [controller](../src/modules/upcoming-events/upcoming-event.controller.js), [service](../src/modules/upcoming-events/upcoming-event.service.js), [repository](../src/modules/upcoming-events/upcoming-event.repository.js)
- [Empty hostel-admin router](../src/modules/hostel-admins/hostel-admins.routes.js)
- [Existing specialized media routes](../src/modules/upload-download/upload-download.routes.js) and [service](../src/modules/upload-download/upload-download.service.js)

