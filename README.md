# PayCircle — Group Expense Management & Settlement Platform

> **Split Smart. Pay Fair. Stay Connected.**

PayCircle is a full-stack group expense management, debt tracking, and UPI settlement platform engineered for roommates, travel groups, college circles, and friends. It combines a **Spring Boot 3.4 (Java 17)** backend with a **React 18 (Vite + Tailwind CSS)** frontend, powered by a **Greedy Min-Cash-Flow Settlement Engine** and **Phone-number UPI Deeplinking**.

---

## 🌟 Key Highlights & Engineering Features

- **Phase 1: Robust Project Setup** — Spring Boot 3.4, PostgreSQL 17/18 persistence, Hibernate JPA with automated DDL updates, and H2 test isolation.
- **Phase 2: JWT Security & Dual Login** — Secure Spring Security filter chain with BCrypt password hashing. Users can authenticate seamlessly using **either Email or Registered Phone Number**.
- **Phase 3: Group Workspace & Phone Invitations** — Create circles for trips, flats, couples, and hackathons. Add members instantly by their **registered mobile number** with role-based permissions (`ADMIN`, `MEMBER`).
- **Phase 4: Advanced 4-Way Expense Splitting**:
  - `= EQUAL`: Evenly divided with exact cents/paise remainder balancing.
  - `₹ EXACT`: Custom fixed amounts per member with exact-total validation.
  - `% PERCENTAGE`: Proportional percentage shares strictly verified to total 100%.
  - `÷ SHARES`: Proportional integer ratio shares (e.g. 2:1:1).
- **Phase 5: Min-Cash-Flow Settlement Engine** — An algorithmic debt simplification engine that reduces circular debts across $N$ members from $O(N^2)$ direct transfers down to at most $N-1$ optimal transactions (identical to modern Splitwise debt simplification).
- **Phase 6: Phone-Number Settlement & UPI Deep-linking**:
  - Request money directly from any user by their phone number.
  - Instant NPCI-standard UPI URI generation (`upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR`).
  - Interactive **UPI QR Code modal** with 1-click launch buttons for **Google Pay, PhonePe, Paytm, and BHIM**.
  - Accepting a request auto-records the settlement and updates balances.
- **Phase 7: Advanced Modules**:
  - **Spending Budgets**: Set monthly limits for groups or personal categories with visual progress meters and alert thresholds (Safe, Warning 80%+, Exceeded).
  - **Recurring Expenses**: Template subscriptions (WiFi bills, maid, Netflix, rent) with active/paused toggles and auto-posting.
  - **Activity Log & Audit Trail**: Chronological timeline of all expense actions, settlements, and invites.
  - **Analytics & Reports**: Visual breakdown by category, member spending distribution, and monthly timelines.
- **Phase 8: Finalization**:
  - Automated JUnit 5 & MockMvc unit/integration test suite.
  - Live **OpenAPI / Swagger 3 UI** at `/swagger-ui.html`.
  - Comprehensive **Postman Collection** with environment variables.
  - Multi-container **Docker Compose** deployment (`db`, `backend`, `frontend`).

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 18 Frontend (Vite)                   │
│   Tailwind CSS  •  Lucide Icons  •  UPI QR Code Engine      │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST API (JWT Bearer)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Spring Boot 3.4 / Java 17 Backend               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Security: Spring Security 6, JWT Filter, BCrypt       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Settlement Engine: Greedy Min-Cash-Flow Simplifier     │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ UPI Integration: NPCI URI & App Intent Builder        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Spring Data JPA  •  Hibernate 6  •  OpenAPI 3 Docs    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JDBC (Port 5432)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (17/18)                 │
│   users • user_groups • group_members • expenses • splits   │
│   settlements • payment_requests • budgets • recurring      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 17 (LTS)** or higher
- **Maven 3.9+**
- **Node.js 18+** & npm
- **PostgreSQL 15+** (or Docker)

### Option A: Running with Docker Compose (Recommended)

To spin up the database, backend, and frontend with a single command:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Database**: PostgreSQL on port 5432 (`paycircle_db`)

---

### Option B: Running Locally

#### 1. Setup PostgreSQL Database
```bash
# Connect to your PostgreSQL server
psql -U postgres

# Create the database
CREATE DATABASE paycircle_db;
```

#### 2. Run Backend
```bash
cd backend
mvn spring-boot:run
```
*The backend automatically seeds 4 realistic demo users, groups, and expenses on the first run.*

#### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Seeded Demo Accounts (1-Click Login)

The application includes pre-configured demo users for testing:

| Name | Login Identifier | Password | Phone | UPI ID | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Soham Chintawar** | `soham@paycircle.app` | `password123` | `+919876543210` | `soham@oksbi` | Group Admin |
| **Priya Sharma** | `priya@paycircle.app` | `password123` | `+919876543211` | `priya@okicici` | Member / Payer |
| **Rahul Verma** | `+919876543212` *(phone)* | `password123` | `+919876543212` | `rahul@okhdfc` | Member |
| **Ananya Iyer** | `ananya@paycircle.app` | `password123` | `+919876543213` | `ananya@paytm` | Member |

*Note: You can log in using either the email or the registered phone number.*

---

## 💡 Settlement Engine: Min-Cash-Flow Algorithm

Suppose in a group of 3 friends:
- **Alice** owes **Bob** ₹50
- **Bob** owes **Charlie** ₹50

Without debt simplification, 2 separate payments are required.
PayCircle computes each member's **Net Balance**:
- $\text{Alice}: -50$ (Debtor)
- $\text{Bob}: 0$ (Completely settled)
- $\text{Charlie}: +50$ (Creditor)

The algorithm simplifies this into **1 single transaction**:
$$\text{Alice} \longrightarrow \text{Charlie}: ₹50$$
Bob does not need to send or receive anything, cutting transaction friction by 50%!

---

## 📡 REST API Reference

All protected endpoints require the `Authorization: Bearer <JWT>` header.

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user (name, email, phone, password, upiId) |
| `POST` | `/api/auth/login` | Login with email or phone number and password |

### 2. User & Phone Directory (`/api/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users/me` | Fetch currently authenticated user profile |
| `PUT` | `/api/users/me` | Update name, phone, UPI ID, or avatar URL |
| `GET` | `/api/users/search?query=...` | Search users by name or phone number |

### 3. Groups (`/api/groups`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/groups` | Create group with initial phone numbers |
| `GET` | `/api/groups` | List all groups current user belongs to |
| `GET` | `/api/groups/{id}` | Get group details with member list & total spending |
| `POST` | `/api/groups/{id}/members` | Add member using their registered phone number |
| `DELETE` | `/api/groups/{id}/members/{userId}` | Remove member from group |

### 4. Expenses (`/api/expenses`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/expenses` | Add expense (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`) |
| `GET` | `/api/expenses/group/{groupId}` | Get group expenses ordered newest first |
| `GET` | `/api/expenses/my` | Get all expenses involving current user |
| `DELETE` | `/api/expenses/{id}` | Delete expense (payer only) |

### 5. Settlement Engine (`/api/settlements`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/settlements/group/{groupId}/balances` | Calculate member balances & Min-Cash-Flow suggestions |
| `GET` | `/api/settlements/overall` | Get overall user balance across all circles |
| `POST` | `/api/settlements` | Record settlement payment (UPI/Cash/Bank) |
| `GET` | `/api/settlements/group/{groupId}` | Get settlement history for group |

### 6. Phone Settlement & UPI (`/api/payment-requests`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payment-requests` | Send settlement request by recipient phone number |
| `GET` | `/api/payment-requests/my` | List incoming & outgoing payment requests |
| `POST` | `/api/payment-requests/{id}/respond` | Accept (`ACCEPT`), decline (`REJECT`), or cancel request |
| `GET` | `/api/payment-requests/{id}/upi-details` | Get NPCI UPI URI and deep links (GPay, PhonePe, Paytm) |

### 7. Budgets, Recurring & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/budgets` | Set group or category budget limit |
| `GET` | `/api/budgets/group/{groupId}` | Get group budget status & threshold warnings |
| `POST` | `/api/recurring-expenses` | Schedule recurring expense template |
| `PATCH`| `/api/recurring-expenses/{id}/toggle` | Pause or activate recurring expense |
| `GET` | `/api/analytics/personal` | Spending breakdown by category & monthly trends |
| `GET` | `/api/activity/feed` | Activity audit trail |

---

## 🧪 Testing

PayCircle includes comprehensive automated tests covering unit algorithms and Spring integration endpoints:

```bash
cd backend
mvn test
```

Tests include:
- `DebtSimplifierTest`: Validates the Min-Cash-Flow greedy debt reduction algorithm under various circular debt graph permutations.
- `AuthControllerTest`: MockMvc integration tests verifying user registration, email login, and phone-number login.
- `PayCircleApplicationTests`: Verifies full Spring context bootstrapping and database initialization.

---

## 📁 Repository Structure

```
PayCircle/
├── backend/
│   ├── src/main/java/com/paycircle/
│   │   ├── config/          # Security, OpenAPI, Web, Demo Data Seeder
│   │   ├── controller/      # 12 REST Controllers
│   │   ├── dto/             # Request & Response Data Transfer Objects
│   │   ├── entity/          # 11 JPA Entities
│   │   ├── enums/           # SplitType, ExpenseCategory, GroupRole, etc.
│   │   ├── exception/       # GlobalExceptionHandler & ErrorResponse
│   │   ├── repository/      # Spring Data JPA Repositories
│   │   ├── security/        # JWT Provider, CustomPrincipal, UserDetails
│   │   ├── service/         # Business logic & algorithms
│   │   └── util/            # DebtSimplifier (Min-Cash-Flow), UpiUtil
│   ├── src/main/resources/  # application.yml, application-h2.yml
│   ├── src/test/            # Unit & Integration Tests
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, QRModal, Modals
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── pages/           # Dashboard, Groups, GroupDetail, Expenses,
│   │   │                    # Settlements, PaymentRequests, Budgets, Analytics
│   │   ├── services/        # Axios API client
│   │   └── utils/           # formatters, categories, icons
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── postman/
│   └── PayCircle_API_Collection.postman_json
├── docker-compose.yml
└── README.md
```

---

## 📄 License
This project is open-source and available under the **Apache License 2.0**.
