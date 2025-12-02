# Review notes — Auth service updates

This document summarizes the edits made to the auth-service and supporting files so a reviewer on your team can quickly scan the changes, run the code locally, and validate behavior.

Summary (one-liner)
- Added JWT-based login, logout and profile endpoints; added separate register endpoints; made local development easier with an in-memory fallback and smoke tests.

Why the change
- Team asked for specific endpoints and behavior: POST /login, POST /logout, POST /register/customer, POST /register/owner, GET /user/profile, PUT /user/profile.
- Also added JWT issuance on login and token-based profile update. For local/CI convenience, added an in-memory DB fallback to avoid needing a running DynamoDB local for quick verification.

Files changed (big-picture)
- BE/package.json — added `jsonwebtoken` + types and `smoke` npm script.
- BE/.env.example — added JWT_SECRET, USE_IN_MEMORY_DB and notes for running locally.
- BE/API-TEST-GUIDE.md — documented token and new endpoints.
- BE/tools/smoke-test.js — added a smoke test script exercising register->login->profile->update->logout.

- BE/services/auth-service/src/routers/users.routers.ts
  - Kept the existing /users/* endpoints for backwards compatibility and registered new simplified endpoints (POST /login, POST /logout, POST /register/customer, POST /register/owner, GET/PUT /user/profile).

- BE/services/auth-service/src/user-services/user.controllers.ts
  - Login now issues JWT token (2h expiry) using JWT_SECRET.
  - Added logout handler that blacklists tokens (in-memory) for local dev.
  - Added registerCustomer and registerOwner helper endpoints.
  - getProfile accepts Authorization Bearer token and falls back to ?user_id for compatibility.
  - updateProfile implemented — PUT /user/profile uses token to identify user.

- BE/services/auth-service/src/user-services/user.services.ts
  - Added USE_IN_MEMORY_DB switch and a simple in-memory store used for local tests.
  - Implemented in-memory CRUD operations and fallback behavior when DynamoDB credentials/connection fail.
  - Improved error messages for easier diagnosis.

- BE/shared/config/dynamodb.config.ts
  - If running in development / DYNAMODB_ENDPOINT is set, we configure endpoint and provide dummy credentials by default so local DynamoDB or missing credentials don't crash the process.


Security & production notes (important)
- Passwords are still stored in plaintext. This is intentional for speed of initial dev but MUST be changed for production. Next recommended step: add bcrypt hashing to `createUser` and compare hashed passwords in `verifyLogin`.
- JWT_SECRET current default is used only if `JWT_SECRET` not provided; set `JWT_SECRET` in `.env` (long random secret) for secure tokens in production and staging.
- Logout currently uses an in-memory blacklist. This is not persistent and will be lost on restart. For production, please use a persistent store (Redis or DB) for token revocation.

How to verify locally (quick)
1) From repository root run these commands (or run from `BE/`):

```bash
cd CloudRacketSystem/BE
cp .env.example .env   # edit JWT_SECRET to secure value (or you can leave default in development)
npm install
USE_IN_MEMORY_DB=true npm run dev
```

2) In a new terminal run the smoke tests (should pass with in-memory store):

```bash
cd CloudRacketSystem/BE
BASE=http://localhost:3000/api node tools/smoke-test.js
# or
npm run smoke
```

What to review (checklist)
- [ ] Confirm endpoints are registered and do not conflict with other routes.
- [ ] Verify login returns token and token can be used to call GET /user/profile and PUT /user/profile.
- [ ] Verify logout invalidates the token (401 after logout).
- [ ] Check controller and service error handling and logging are clear and actionable.
- [ ] Confirm README/API-TEST-GUIDE contains steps for production (JWT secret, DynamoDB, etc.).
- [ ] Security review: confirm password hashing is added before production; recommend Redis for token revocation.

Recommended next PRs (small, independent)
- Add bcrypt password hashing and adjust verifyLogin accordingly.
- Add persistent token revocation (Redis) and cleanup of expired tokens.
- Add unit and integration tests (Jest + supertest) that exercise controller logic and mocks for DynamoDB.

Notes for the reviewer
- I added an in-memory option `USE_IN_MEMORY_DB=true` to make local testing reliable when DynamoDB or credentials are not available. This should be toggled off in integration tests that run against a real DynamoDB/Local setup.
- If you want me to split this into smaller PRs (controllers first, services next, config/tests after), I can do that.
