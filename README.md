# 🎟️ EventPass — Event Ticketing & QR Check-In System

**EventPass** is a full-stack campus event ticketing system that allows students to register for events, receive cryptographically secured QR tickets by email, and check in at the event using an organizer portal.

The system is designed around a simple workflow:

**Browse Event → Register → Receive Ticket → Scan QR → Check In**

🌐 **Live Production:**  
https://eventticketingsystem-mocha.vercel.app/

---

## ✨ Features

### Student / Participant

- Browse available campus events
- View event details, venue, date, and capacity
- Register using name and email
- Capacity-aware registration
- Prevent duplicate registration for the same event
- Receive an automated confirmation email
- Receive a unique QR ticket through email
- Receive a unique Ticket ID as a manual fallback

### Organizer

- Secure organizer login using JWT authentication
- Dedicated organizer portal
- Create and publish new events
- Scan tickets using a webcam
- Manually verify tickets using Ticket ID
- Real-time ticket validation
- Prevent duplicate check-ins

### Ticket Security

- Unique ticket generated for every registration
- Cryptographically signed ticket token
- Only a hash of the ticket token is stored in the database
- QR code contains the signed ticket token
- Backend performs the actual ticket verification
- Ticket states:
  - `VALID`
  - `CHECKED_IN`
  - `ALREADY USED`
  - `INVALID TICKET`

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- html5-qrcode
- Lucide React

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt
- Nodemailer

### Services

- **Supabase PostgreSQL** — database
- **Brevo SMTP** — transactional email
- **Vercel** — production deployment

### Other

- QR Code generation
- HMAC-SHA256 ticket signing
- REST API
- Server-side ticket verification

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      Student        │
                    │                     │
                    │ Browse / Register   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       Vite          │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │                     │
                    │ Events              │
                    │ Registration        │
                    │ Ticket Verification │
                    │ Organizer Auth      │
                    └──────┬───────┬──────┘
                           │       │
                ┌──────────┘       └────────────┐
                ▼                               ▼
      ┌──────────────────┐             ┌──────────────────┐
      │ PostgreSQL       │             │ Brevo SMTP       │
      │ Supabase         │             │ Ticket Email     │
      └──────────────────┘             └──────────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │ QR Ticket    │
                                        └──────┬───────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │ Organizer Portal │
                                      │                  │
                                      │ QR Scanner       │
                                      │ Ticket ID        │
                                      └──────────────────┘
```

---

## 📂 Project Structure

```text
event_ticketing/
│
├── api/
│   └── index.js
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── eventController.js
│   │   │   ├── registrationController.js
│   │   │   ├── ticketController.js
│   │   │   └── organizerController.js
│   │   │
│   │   ├── middleware/
│   │   │   └── organizerAuth.js
│   │   │
│   │   ├── routes/
│   │   │   ├── events.js
│   │   │   ├── registrations.js
│   │   │   ├── tickets.js
│   │   │   └── organizers.js
│   │   │
│   │   ├── services/
│   │   │   └── mailer.js
│   │   │
│   │   ├── utils/
│   │   │   └── createOrganizer.js
│   │   │
│   │   ├── db.js
│   │   └── server.js
│   │
│   ├── sql/
│   │   └── 001_initial_schema.sql
│   │
│   ├── .env
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── package-lock.json
│
├── .env.example
├── .gitignore
├── vercel.json
└── README.md
```

> `.env` is intentionally not committed to the repository.

---

# 🚀 Running Locally

## Prerequisites

Make sure you have:

- Node.js 18+ installed
- npm
- A PostgreSQL database
- A Brevo account with SMTP credentials

---

## 1. Clone the Repository

```bash
git clone https://github.com/pal-debarpan/event_ticketing_system.git
cd event_ticketing_system
```

---

## 2. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

---

## 3. Configure Environment Variables

Create:

```text
backend/.env
```

using `.env.example` as a reference.

Required variables:

```env
DATABASE_URL=your_postgresql_connection_string

TICKET_SECRET=your_ticket_secret
JWT_SECRET=your_jwt_secret

BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_smtp_login
BREVO_SMTP_KEY=your_brevo_smtp_key
BREVO_FROM_EMAIL=your_verified_sender_email
```

### Environment Variable Explanation

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL database connection |
| `TICKET_SECRET` | Secret used to cryptographically sign ticket tokens |
| `JWT_SECRET` | Secret used to sign organizer authentication JWTs |
| `BREVO_SMTP_HOST` | Brevo SMTP server |
| `BREVO_SMTP_PORT` | Brevo SMTP port |
| `BREVO_SMTP_USER` | Brevo SMTP login |
| `BREVO_SMTP_KEY` | Brevo SMTP authentication key |
| `BREVO_FROM_EMAIL` | Verified email address used to send tickets |

**Never commit the real `.env` file or SMTP credentials to GitHub.**

---

# 🗄️ Database Setup

The project uses PostgreSQL.

The database schema is located at:

```text
backend/sql/001_initial_schema.sql
```

Run this SQL file against your PostgreSQL database before starting the application.

The schema creates:

- `events`
- `participants`
- `registrations`
- `tickets`
- `check_ins`
- `organizers`

---

# ▶️ Start the Application

The backend and frontend run separately during local development.

### Start Backend

From:

```text
event_ticketing/backend
```

run:

```bash
node src/server.js
```

The backend runs on:

```text
http://localhost:3000
```

### Start Frontend

Open another terminal:

```bash
cd event_ticketing/frontend
npm run dev
```

Vite will provide the frontend URL, normally:

```text
http://localhost:5173
```

Open that URL in your browser.

---

# 🔐 Organizer Portal

There is intentionally **no organizer registration page**.

The system uses a predefined organizer account because organizer access is an administrative function rather than a public registration feature.

### Demo Organizer Credentials

```text
Email:    organizer@awsbuilderclub.com
Password: Organizer@123
```

Use these credentials to access the organizer portal.

> **Note:** These credentials are provided specifically for evaluating/testing this project. In a real production system, organizer credentials should be securely managed and rotated.

---

# 📷 Testing the Organizer Scan Workflow Locally

This is the complete recommended local test.

### Step 1 — Start both applications

Start:

```text
Backend → http://localhost:3000
Frontend → http://localhost:5173
```

### Step 2 — Create or use an event

From the student-facing frontend:

1. Open an event.
2. Enter a participant name.
3. Enter an accessible email address.
4. Submit the registration.

### Step 3 — Check the confirmation email

The participant should receive an email through Brevo containing:

- Event information
- QR ticket
- Ticket ID

The QR code contains the signed ticket token.

### Step 4 — Open the Organizer Portal

Navigate to:

```text
http://localhost:5173/organizer/login
```

Log in using:

```text
Email: organizer@awsbuilderclub.com
Password: Organizer@123
```

### Step 5 — Scan the QR Code

Open the organizer check-in page and allow camera access.

Show the QR code from the confirmation email to the webcam.

The first successful scan should return:

```text
CHECKED-IN
```

### Step 6 — Test Duplicate Check-In

Scan the exact same QR code again.

The system should return:

```text
ALREADY USED
```

along with the original check-in timestamp.

### Step 7 — Test Manual Ticket ID

If QR scanning is unavailable, use the Ticket ID shown in the confirmation email.

Enter it into the manual verification field.

The system can verify the ticket without requiring the QR scanner.

### Step 8 — Test Invalid Tickets

Try an invalid or malformed Ticket ID/token.

The system should return:

```text
INVALID TICKET
```

---

# 🎫 Ticket Verification Flow

When a participant registers:

```text
Participant Registration
        ↓
Registration Created
        ↓
Unique Ticket Generated
        ↓
HMAC-SHA256 Signed Token
        ↓
Token Hash Stored in Database
        ↓
QR Code Generated
        ↓
Brevo Email Sent
```

When an organizer scans the ticket:

```text
QR / Ticket ID
      ↓
Backend Verification
      ↓
Ticket Exists?
      ↓
Signature / Ticket Valid?
      ↓
Ticket Already Checked In?
      │
      ├── No → CHECKED-IN
      │
      └── Yes → ALREADY USED
```

Invalid or malformed tickets are rejected as:

```text
INVALID TICKET
```

The actual ticket token is **not stored directly in the database**. A SHA-256 hash is stored for verification.

---

# 🔌 API Endpoints

## Events

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | Get all events |
| `GET` | `/api/events/:id` | Get a specific event |
| `POST` | `/api/events` | Create an event |

## Registration

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events/:eventId/register` | Register a participant |

## Ticket Verification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tickets/verify` | Verify QR token or Ticket ID |

Ticket verification requires organizer authentication.

## Organizer Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/organizers/login` | Organizer login |
| `GET` | `/api/organizers/me` | Get authenticated organizer |

---

# ☁️ Production Deployment

The application is deployed as a **single Vercel project**.

### Production URL

🌐 **https://eventticketingsystem-mocha.vercel.app/**

The same deployment serves:

```text
/                     → React application
/events/:id           → Event details
/registration-success → Registration result
/organizer/login      → Organizer login
/organizer/check-in   → Organizer check-in
/api/*                → Express API
```

Production environment variables are configured through Vercel.

The frontend uses the same-origin `/api` path, so a separate backend URL is not required.

---

# 🧪 Production Testing

The production application can be tested using the following flow:

```text
1. Browse an event
       ↓
2. Register
       ↓
3. Receive email
       ↓
4. Open QR ticket
       ↓
5. Organizer login
       ↓
6. Scan QR
       ↓
7. CHECKED-IN
       ↓
8. Scan again
       ↓
9. ALREADY USED
```

Manual Ticket ID verification is also supported as a fallback.

---

# 🔒 Security Considerations

The project implements several security measures:

- JWT-based organizer authentication
- bcrypt password hashing
- HMAC-SHA256 ticket signing
- SHA-256 ticket hash storage
- Database uniqueness constraints
- Transaction-based registration
- Row locking during ticket verification
- Duplicate check-in prevention
- Environment variables for secrets
- No public organizer registration

---

# 📌 Design Decisions

### Why no organizer registration?

Organizer accounts represent administrative access to the event system. Allowing anyone to create an organizer account would allow unauthorized users to access event creation and ticket verification.

Therefore, the project uses a predefined organizer account for the current scope.

### Why is the QR code only sent by email?

The QR ticket is intended to act as the participant's confirmation ticket. Keeping it in the confirmation email prevents the public event page from exposing ticket credentials.

### Why is there a Ticket ID fallback?

Webcam access or QR scanning may occasionally fail because of camera permissions, lighting, or device limitations. The Ticket ID provides a reliable manual verification method.

---

# 🔮 Future Improvements

Possible future improvements include:

- Multiple organizer accounts with role-based permissions
- Organizer account management
- Event editing and cancellation
- Email templates and branding customization
- Rate limiting for public APIs
- Redis-based caching
- Attendance analytics
- Automated event reminders
- Ticket expiration
- More advanced audit logging

---

# 👨‍💻 Author

**Debarpan Pal**

B.Tech Computer Science and Engineering  
Vellore Institute of Technology, Vellore

GitHub:  
https://github.com/pal-debarpan

Project Repository:  
https://github.com/pal-debarpan/event_ticketing_system

---

## 📄 License

This project was developed as part of an academic/recruitment project and is intended for demonstration and educational purposes.