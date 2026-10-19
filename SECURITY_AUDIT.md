# Docsheba Security Audit Runbook

Run this against **your own app on localhost or a staging copy**, never someone else's. Tick each box; write down what you see. Anything marked FAIL gets a ticket.

## 0. Setup
- `cd backend && cp .env.example .env`, generate three *different* secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `npm run make:admin -- you@mail.com "<12+ char password>"`
- Create 3 accounts: patient A, patient B, doctor (apply + admin approves). Log in as each and copy the three tokens: `TA`, `TB`, `TD`, plus `TADMIN`.

## 1. Automated sweeps (30 min)
| Tool | Command | Pass if |
|---|---|---|
| npm audit | `npm audit` in `backend/` and `frontend/` | no high/critical |
| Secret scan | `npx gitleaks detect` (or `trufflehog git file://.`) | no secrets in history. If `.env` was ever committed, rotate every key |
| Static analysis | `npx semgrep --config p/nodejs --config p/jwt --config p/react` | reviewed, no unexplained findings |
| Header check | `curl -I localhost:3001/test` | has CSP, `X-Content-Type-Options`, no `X-Powered-By` |
| Dynamic scan | OWASP ZAP baseline against the *staging* URL: `docker run -t zaproxy/zap-stable zap-baseline.py -t http://host.docker.internal:3001` | no medium+ alerts |

## 2. Manual tests (curl). `B=http://localhost:3001/api`
**Authentication**
1. No token on a protected route: `curl $B/users` → expect 401.
2. Tampered token: edit one char of `TA` → 401. Change `alg` to `none` (jwt.io) → 401.
3. NoSQL injection: `curl -XPOST $B/users/login -H 'content-type: application/json' -d '{"email":{"$ne":null},"password":"x"}'` → expect 400, not 401/200/500.
4. Brute force: send 15 wrong logins in a row → expect 429 after 10.
5. Unknown vs wrong-password email → identical message **and** similar response time.
6. Register with `"password":"short"` → 400. With a 5,000-char password → 400.
7. Production mode (`NODE_ENV=production`): register response must contain **no** `token`, and server logs must not print it.
8. Ban a user, then reuse their old token → expect 403 immediately. Demote a doctor to patient, then reuse their old token on `/slots` → expect 403 immediately (role comes from the DB, not the JWT).

**Authorization (IDOR / privilege escalation). This is the most likely place for real bugs**
9. Patient token on admin routes: `PATCH $B/doctors/<id>/approve`, `GET $B/users`, `PATCH $B/appointments/<id>/approve` → all 403.
10. Patient token on doctor routes: `POST $B/slots` → 403.
11. Doctor A cancels or completes doctor B's appointment: `PATCH $B/appointments/<B's id>/status` with `TD` → 403.
12. Doctor A edits doctor B's slot: `PATCH $B/slots/<B's slot>` → 404/403.
13. Edit a **booked** slot → 404 (blocked).
14. Patient B reads patient A's appointments: confirm `/appointments/myappointment` only returns B's. Check whether anything lets you fetch another user's by id.
15. Mass assignment: register with extra fields `"role":"admin"`, `"isBanned":false`; confirm the created user is `patient`.
16. Apply as doctor with `"status":"approved"` in the body; confirm the status is still `pending`.
17. Double booking: fire 20 parallel booking requests for one slot (`seq 20 | xargs -P20 -I{} curl ...`). Exactly one 201, the rest 409.
18. Book the slot of an unapproved or banned doctor via a raw `slotId`; check whether it succeeds (should it?).

**Input handling**
19. Send `{"slotId":{"$gt":""}}` to `POST $B/appointments` → 400.
20. `GET $B/users?search=(a+)+$&limit=100000` as admin → fast response, `limit` clamped to 50.
21. `GET $B/doctors?specialization=.*` → treated as literal text.
22. Upload `shell.php` renamed to `.jpg` with a real image MIME header → ensure it is stored with a safe extension and never executed. Upload a 3 MB image → rejected (2 MB cap). Upload a polyglot/SVG → rejected.
23. Path traversal: `curl --path-as-is localhost:3001/public/../.env` and `/public/%2e%2e/.env` → 404, never file content.
24. Post a 1 MB JSON body → 413.

**Data exposure**
25. `GET $B/doctors` (unauthenticated): note which fields leak. **Currently returns doctor email and phone to the public. Decide if that is acceptable.**
26. Check every response for `password`, `passwordHash`, `__v`, or internal ids you don't want exposed. `GET $B/users` as admin must not include password hashes.
27. Trigger a 500 (malformed ObjectId on `/appointments/zzz/approve`) → generic message, no stack trace.

**Frontend**
28. Search `frontend/src` for `dangerouslySetInnerHTML`, `innerHTML`, `eval` → none today. Keep it that way.
29. Try `<img src=x onerror=alert(1)>` as name, address, appointment reason, doctor bio. React escapes it, but confirm on every screen that renders it (admin pages especially).
30. Tokens live in `localStorage`, so any XSS means account takeover. The CSP from helmet helps. For production, move to an httpOnly + SameSite cookie.
31. Hit protected pages as the wrong role in the UI. Route guards are UX only; the API checks in section 2 are the real control.

## 3. Pre-deploy checklist
- [ ] `NODE_ENV=production`, fresh JWT secrets, `CLIENT_ORIGIN` set to the real site, `TRUST_PROXY` set if behind a proxy
- [ ] HTTPS everywhere; MongoDB not exposed to the internet (Atlas IP allowlist, auth on, least-privilege DB user)
- [ ] `.env` and `node_modules` never committed; secret scan clean
- [ ] Real activation email (SMTP) wired in; the dev-only token echo is gone
- [ ] Uploads served from a non-executable location (or object storage), backups enabled
- [ ] Log retention without tokens or passwords; alert on spikes of 401/403/429

## 4. Known gaps (not fixed in this pass)
1. **Prescriptions (soft copy) don't exist yet.** Building this securely means private storage, doctor-to-own-patient access only, and short-lived signed download URLs. Never put them in `/public`.
2. **No refresh-token flow.** 15-minute tokens log users out; `JWT_REFRESH_KEY` is unused. Implement rotation with an httpOnly cookie, or drop the key.
3. **No email verification** (activation token still echoed outside production).
4. **Public doctor listing leaks email/phone** (see test 25). Not changed because the UI may rely on it.
5. **Booking isn't transactional.** A crash between marking the slot booked and creating the appointment strands the slot. Use a Mongo transaction (needs a replica set).
6. **Doctor cancelling an appointment doesn't free the slot.**
7. **No automated tests.** Write the section 2 checks as supertest cases so they run in CI.
8. **No account lockout/CAPTCHA** beyond IP rate limiting; no password reset flow; no audit log of admin actions.
9. **Mongo/Express hardening not yet covered:** `npm audit` in CI, Dependabot, `mongoose.set('sanitizeFilter', true)`.

## 5. What this pass already changed
helmet + CSP, rate limits (global, login, register, activate), 20 KB body cap, CORS from env, no plaintext password inside the activation JWT, activation token hidden in production, JWT algorithm pinned to HS256, role/ban read from DB on every request, NoSQL-injection type checks, regex escaping on search, pagination clamps, status whitelists, ObjectId validation, booked slots can't be edited, upload extension derived from the validated MIME type, JWT secrets must be 32+ chars and distinct, admin script no longer has default credentials, password minimum raised to 8 (72 max).
