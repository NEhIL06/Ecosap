## EcoSAP API Documentation

This document describes the HTTP API exposed by the EcoSAP service.

- Base URL: `http://localhost:3000`
- API prefix: `/api/v1`
- Auth: JWT via `Authorization: Bearer <token>`

### Environment
- **JWT_SECRET**: Secret for signing JWT tokens
- **DB_CONN_STRING**: MongoDB connection string

### Health
- **GET** `/` → 200 OK, returns "Hello World"

---

## Auth Routes

All routes below are prefixed with `/api/v1`.

### POST `/api/v1/login`
Authenticate a user and receive a JWT.

- Query params (validated):
  - `email` (string, email)
  - `password` (string, 6-20 chars)

- Responses:
  - 200: `{ "token": string }`
  - 400: `{ error: string | zodError }`

Example:
```bash
curl -X POST "http://localhost:3000/api/v1/login?email=user@example.com&password=secret123"
```

### POST `/api/v1/SignUp`
Create a new user.

- Body (validated and stored):
  - `username` (string)  ← persisted by the API
  - `email` (string, email)
  - `password` (string, 6-20 chars)
  - `phone` (string, 10 chars)
  - `address` (string, 10-100 chars)
  - `coordinates` (object)
    - `latitude` (number)
    - `longitude` (number)
  - `aadhar_number` (string, 12 chars)
  - `signature` (string)
  - `ecocredits` (number, optional; defaults to 0 if omitted)

- Responses:
  - 201: Returns created user document
  - 400: `{ error: string | zodError }`

Example:
```bash
curl -X POST http://localhost:3000/api/v1/SignUp \
  -H "Content-Type: application/json" \
  -d '{
    "username": "EcoUser",
    "email": "user@example.com",
    "password": "secret123",
    "phone": "0123456789",
    "address": "123 Greenway, Earth",
    "coordinates": { "latitude": 12.34, "longitude": 56.78 },
    "aadhar_number": "123456789012",
    "signature": "base64-signature"
  }'
```

---

## User Routes

All routes below are prefixed with `/api/v1/user` and require `Authorization: Bearer <token>`.

### GET `/api/v1/user/me`
Returns the authenticated user.

- Responses:
  - 200: `{ user: <userDocument> }`
  - 401/402: Auth errors

Example:
```bash
curl http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer <TOKEN>"
```

### POST `/api/v1/user/update`
Updates fields of the authenticated user.

- Body:
  - `updates` (object): key-value pairs to assign onto the user document

- Responses:
  - 200: `{ user: <updatedUserDocument> }`
  - 400: `{ error: any }`

Example:
```bash
curl -X POST http://localhost:3000/api/v1/user/update \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "updates": { "address": "New address" } }'
```

### POST `/api/v1/user/delete`
Deletes the authenticated user.

- Responses:
  - 200: `{ message: "User deleted" }`
  - 400: `{ error: any }`

Example:
```bash
curl -X POST http://localhost:3000/api/v1/user/delete \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Sapling Routes

All routes below are prefixed with `/api/v1/sapling` and require `Authorization: Bearer <token>`.

### POST `/api/v1/sapling/credits`
Calculates area via an external service and credits the authenticated user.

- Body:
  - `image`: either
    - a Base64-encoded image string, or
    - a file upload (multipart/form-data field `image`)
  - `gsd` (number): Ground Sample Distance (resolution metric)

- Behavior:
  - Sends `image` and `gsd` to `http://localhost:5000/area`
  - Uses the returned `area` to compute credits
  - Increments the user’s `ecocredits`

- Responses:
  - 200: `{ success, area, creditsAdded, totalCredits, message }`
  - 400: `{ error: string }` (validation or invalid area)
  - 404: `{ error: "User not found" }`
  - 500/503: `{ error: string, details? }`

Example (Base64 JSON body):
```bash
curl -X POST http://localhost:3000/api/v1/sapling/credits \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "image": "<BASE64>", "gsd": 1.0 }'
```

Example (multipart file upload):
```bash
curl -X POST http://localhost:3000/api/v1/sapling/credits \
  -H "Authorization: Bearer <TOKEN>" \
  -F image=@/path/to/image.jpg \
  -F gsd=1.0
```

---

## Auth Middleware

The API expects `Authorization: Bearer <token>`. Tokens are verified using `JWT_SECRET`. On success, the user document is attached to `req.body.user`.

Possible errors:
- 402: `{ message: "token is missing" }`
- 401: `{ message: "Token expired" }` or `{ message: "Unauthorized" }` or `{ message: "User not found" }`

---

## Notes
- The login route currently reads credentials from query parameters.
- Ensure the external area calculation service is running on `http://localhost:5000/area`.
- Server listens on port `3000`.


