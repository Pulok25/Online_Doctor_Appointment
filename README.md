# Online Doctor Appointment and Patient Management System

MERN stack web application for booking doctor appointments. Built as a final-year portfolio project.

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB (Mongoose)
**Auth:** JWT (access token + email-activation token), bcrypt for password hashing
**Other:** cors, morgan, dotenv, http-errors, nodemon

**Frontend:** React (Vite), React Router, Axios *(update once frontend work starts)*

## Features (so far)

- User registration with email-activation flow (JWT-based, no real email sending yet — token returned in response for testing)
- Login with access token (role-based: patient / doctor / admin)
- Role-based route protection (`isLoggedIn`, `isAdmin` middleware)
- Admin: view/search all users (paginated)
- Doctor application flow: a registered patient can apply to become a doctor with specialization, qualification, experience, fee, and BMDC registration number
- Admin: view pending doctor applications, approve or reject them
- On approval, user role is upgraded from `patient` to `doctor`
- SlotModel Create which can solve when `doctor` can take the appointment track the appointment

## Planned

- Doctor slot/availability management
- Appointment booking (patient books a slot)
- Doctor dashboard to confirm/complete appointments
- Patient appointment history
- Frontend (React)

## Project Structure