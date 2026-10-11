# Online Doctor Appointment and Patient Management System

A MERN-stack web application for booking doctor appointments, with role-based access for patients, doctors, and admins. Built as a final-year portfolio project.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, Express 5, MongoDB with Mongoose 9 |
| Auth | JWT (access token and email-activation token), bcrypt password hashing |
| Backend utilities | cors, morgan, dotenv, http-errors, nodemon |
| Frontend | React 19, Vite, React Router 7, Axios |
| Styling | Tailwind CSS 4, daisyUI 5 |
| Tooling | Oxlint |

## Features

**Accounts and auth**
- Registration with an activation step: the server signs a 10-minute activation token, and the account is only created when the token is submitted to `/api/users/activate`. No email is sent yet; the token is returned in the response (and logged by the server), and the frontend shows an "Activate Account" button in its place.
- Login returns a 15-minute access token. Banned accounts are rejected.
- Three roles: `patient` (default), `doctor`, `admin`.
- Passwords are hashed with bcrypt and excluded from queries by default.

**Patients**
- Browse approved doctors and filter by specialization (case-insensitive search).
- View a doctor's available slots and book one with an optional reason.
- Dashboard with appointment counts (upcoming, completed, cancelled) and status badges.
- Apply to become a doctor (specialization, qualification, experience, fee, BMDC registration number, bio).

**Doctors**
- Create availability slots (date, start time, end time).
- Dashboard listing their appointments with patient name, phone, and reason.
- Mark an admin-approved appointment as completed.

**Admins**
- Review doctor applications by status (pending, approved, rejected) and approve or reject them. Approval upgrades the user's role to `doctor`.
- Approve pending appointments (API only, see below).
- List and search users, paginated (API only).

**Booking integrity**
- Booking claims a slot with an atomic `findOneAndUpdate` on `isBooked: false`, so two patients cannot book the same slot. If creating the appointment fails, the slot is released.
- Slots are unique per doctor, date, and start time. Each slot can have at most one appointment.
- BMDC numbers are normalized to uppercase and must be unique; each user can submit only one application.

## Appointment Lifecycle

```
patient books slot  ->  pending  --(admin approves)-->  approved  --(doctor)-->  completed
                           |                                |
                           +--------(doctor cancels)--------+-->  cancelled
```

A doctor can only mark an appointment `completed` after an admin has approved it.

## Getting Started

### Prerequisites

- Node.js (a version that supports Express 5 and Vite 8; current LTS is fine)
- A running MongoDB instance, local or Atlas

### 1. Clone

```bash
git clone https://github.com/Pulok25/Online_Doctor_Appointment.git
cd Online_Doctor_Appointment
```

### 2. Backend

```bash
cd backend
npm install
```


> **Port matters.** The backend defaults to port `3002` if `SERVER_PORT` is unset, but the frontend's Axios client is hardcoded to `http://localhost:3001/api` (`frontend/src/api/axiosInstance.js`). Set `SERVER_PORT=3001`, or change the frontend base URL to match.

Environment variables read by `backend/src/secret.js`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_PORT` | `3002` | Port the API listens on |
| `MONGODB_URL` | `mongodb://localhost:27017/` | MongoDB connection string. Include a database name, or MongoDB will use `test`. |
| `JWT_ACTIVATION_KEY` | hardcoded dev value | Signs account-activation tokens |
| `JWT_ACCESS_KEY` | hardcoded dev value | Signs login access tokens |
| `JWT_REFRESH_KEY` | hardcoded dev value | Defined but not used yet |
| `DEFAULT_USER_IMAGE_PATH` | `public/images/users/default.webp` | Default value for the user `image` field |

Always set your own JWT keys. The fallback values are committed to the repo and are public.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The backend's CORS policy only allows this origin.

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

### 4. Create an admin

There is no admin signup or seed script. Register and activate a normal account, then promote it directly in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Log out and back in afterward. The role is stored inside the JWT, so an existing token will not reflect the change.

## Walkthrough: Running the Full Flow

1. **Register** at `/register`, click **Activate Account**, then **log in**.
2. **Apply as a doctor** from the patient dashboard (`/apply-doctor`).
3. **Approve the application** as an admin at `/admin/applications`.
4. **Log in again as the new doctor.** The old token still says `patient` until you do.
5. **Create slots** as the doctor (API only, see example below).
6. **Book a slot** as a patient at `/doctors`. The appointment starts as `pending`.
7. **Approve the appointment** as an admin (API only).
8. **Mark it completed** from the doctor dashboard.

Steps 5 and 7 have no frontend screens yet, so use curl, Postman, or similar:

```bash
# Create a slot (doctor token)
curl -X POST http://localhost:3001/api/slots \
  -H "Authorization: Bearer <doctor_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-11-01","startTime":"10:00","endTime":"10:30"}'

# Approve an appointment (admin token)
curl -X PATCH http://localhost:3001/api/appointments/<appointment_id>/approve \
  -H "Authorization: Bearer <admin_access_token>"
```

## API Reference

Base URL: `http://localhost:<SERVER_PORT>`. Protected routes expect `Authorization: Bearer <accessToken>`.

Success responses look like `{ success: true, message, payload }`; errors look like `{ success: false, message }`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/test` | Public | Health check |
| POST | `/api/users/register` | Public | Validate input and return an activation token |
| POST | `/api/users/activate` | Public | Create the user from an activation token |
| POST | `/api/users/login` | Public | Log in, returns user and access token |
| GET | `/api/users` | Admin | List non-admin users. Query: `search`, `page`, `limit` (default 5) |
| POST | `/api/doctors/apply` | Logged in | Submit a doctor application |
| GET | `/api/doctors/applications` | Admin | List applications. Query: `status` (default `pending`) |
| PATCH | `/api/doctors/:id/approve` | Admin | Approve an application and set the user's role to `doctor` |
| PATCH | `/api/doctors/:id/reject` | Admin | Reject an application |
| GET | `/api/doctors` | Public | List approved doctors. Query: `specialization` |
| POST | `/api/slots` | Doctor | Create a slot |
| GET | `/api/slots/doctor/:doctorId` | Public | Unbooked slots for a doctor, sorted by date and time |
| GET | `/api/slots/my-slots` | Doctor | The doctor's own unbooked slots |
| POST | `/api/appointments` | Logged in | Book a slot. Body: `slotId`, optional `reason` |
| GET | `/api/appointments/myappointment` | Logged in | Appointments for the current patient or doctor, newest first |
| PATCH | `/api/appointments/:id/approve` | Admin | Move a `pending` appointment to `approved` |
| PATCH | `/api/appointments/:id/status` | Logged in (must be the appointment's doctor) | Set status to `completed` or `cancelled` |

## Data Models

- **User**: name, email (unique), password (hashed, hidden by default), role, image, address, phone, isBanned
- **DoctorProfile**: user (unique ref), specialization, qualification, experienceYears, fee, bmdcNumber (unique), bio, status (`pending` / `approved` / `rejected`)
- **Slot**: doctor (ref), date, startTime, endTime, isBooked. Unique on doctor + date + startTime.
- **Appointment**: patient (ref), doctor (ref), slot (unique ref), reason, status (`pending` / `approved` / `completed` / `cancelled`)

All models include `createdAt` and `updatedAt`.

## Frontend Routes

| Route | Page |
| --- | --- |
| `/login`, `/register` | Authentication |
| `/doctors` | Doctor search and booking modal |
| `/patient/dashboard` | Patient appointments and stats |
| `/apply-doctor` | Doctor application form |
| `/doctor/dashboard` | Doctor appointments, mark completed |
| `/admin/applications` | Admin review of doctor applications |

Auth state (user and access token) is kept in React context and mirrored to `localStorage`. Routes are not guarded on the client yet; the API enforces access.

## Project Structure

```
.
├── backend/
│   ├── public/images/userImage/   # default user avatar
│   └── src/
│       ├── app.js                 # Express app, middleware, routes, error handling
│       ├── server.js              # Entry point
│       ├── secret.js              # Env var loading and defaults
│       ├── config/db.js           # MongoDB connection
│       ├── controller/            # Request handlers (user, doctor, slot, appointment, responses)
│       ├── helper/jsonwebtoken.js # JWT signing helper
│       ├── middlewares/           # isLoggedIn, isAdmin, isDoctor
│       ├── models/                # Mongoose schemas
│       └── router/                # Route definitions
└── frontend/
    └── src/
        ├── api/axiosInstance.js   # Axios client with auth header interceptor
        ├── context/AuthContext.jsx
        ├── Components/Navbar.jsx
        ├── pages/                 # Page components
        └── routes/AppRoutes.jsx
```

## Known Limitations and Roadmap

- No real email delivery for account activation.
- No frontend screens for doctors to manage slots or for admins to approve appointments and manage users.
- No cancel option in the patient UI, and cancelling an appointment does not free its slot.
- No refresh-token flow; sessions end after 15 minutes.
- No client-side route guards or dashboard links in the navbar.
- Slot times are free-form strings: no format, overlap, or past-date validation.
- No automated tests (`npm test` is a placeholder).
- No admin seeding script.