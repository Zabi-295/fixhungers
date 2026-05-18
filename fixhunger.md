# 🍽️ Fix Hunger - Product Architecture & Technical Documentation

Fix Hunger is a community-driven, real-time food rescue and surplus donation platform designed to bridge the gap between **Food Providers** (Restaurants, Hotels, Event Organizers) and **NGO Volunteers** (Rescue teams, Food collection teams). The project incorporates a comprehensive **Admin Operations Panel** for auditing, analytics, user lifecycle management, and dedicated user technical support.

---

## 🛠️ Technology Stack
* **Frontend**: React.js (TypeScript), Vite (Bundler), Tailwind CSS (Aesthetic Styling), Radix UI (Accessible Primitives), Lucide React (Premium Icon Pack), Leaflet Map Engine.
* **Backend**: Node.js, Express.js (mounted on serverless environments), Mongoose (MongoDB Object Modeling).
* **Database**: MongoDB Atlas (User Accounts, Conversations, Tickets, Donations) & Firebase Auth (cross-client user state).

---

## 📁 1. Project Directory Structure
```
fix-hunger/
├── api/                   # Serverless Express backend main gateway (Vercel Entry)
├── server/                # Express Server core logics
│   ├── middleware/        # Security and Session verify filters
│   ├── models/            # Database Mongoose structures
│   ├── routes/            # REST API Route handlers
│   └── utils/             # Helper tools (Email services, etc.)
├── src/                   # React Frontend App
│   ├── components/        # Shared layouts, messaging widgets, and theme setups
│   ├── context/           # React Global State Providers
│   ├── hooks/             # Utility Hooks
│   ├── lib/               # Third-party configurations and REST Clients
│   ├── pages/             # Frontend Dashboard and Public routes
│   ├── App.tsx            # Routes configuration and providers wrapper
│   └── main.tsx           # Entry React DOM mount script
└── Config Files           # Tailwind, Vite, TypeScript, and Git configs
```

---

## 🧱 2. Backend Architecture (`server/` & `api/`)

### 🔑 REST API Gateway
#### 📄 `api/index.js`
* **Type**: Express Application Initialization.
* **Objective**: Binds database connections, sets up JSON parser limits (10MB for food images scan), registers CORS handlers, and initializes Gemini AI engines.
* **Core Endpoints**:
  * `POST /api/ai/analyze-food`: Captures base64 images of food items and forwards them to Gemini AI (`gemini-1.5-flash`) to instantly classify food types, food categories, and forecast shelf-life hours.
  * `POST /api/ai/chat`: Feeds Gemini AI with live local donation metrics to help NGO volunteers coordinate rescues dynamically.

---

### 🗄️ Database Schemas (`server/models/`)

#### 📄 `server/models/User.js`
* **Type**: Mongoose Database Schema.
* **Objective**: Defines user authentication, physical locations, status parameters, and notification settings.
* **Key Fields**: Name, Email, Password Hash, Role (`Admin`/`NGO`/`Provider`), Profile Settings (Org Name, Vehicle details, Phone, Coordinates), Rank, Rating, and Active flags (`isActive`).

#### 📄 `server/models/Donation.js`
* **Type**: Mongoose Database Schema.
* **Objective**: Handles physical metadata for surplus food donations listed by Providers.
* **Key Fields**: Donor Reference, Food Item Specs (Title, Category, Quantity, Image, Shelf Life), Coordinate Positions (`lat`/`lng`), Address, and Lifespan Tracking (`Available`, `Claimed`, `Delivered`, `Expired`).

#### 📄 `server/models/Ticket.js`
* **Type**: Mongoose Database Schema.
* **Objective**: Stores customer support and issue-tracking records.
* **Key Fields**: Ticket Author Reference, Role, Ticket Status (`Open`/`Closed`), and chronologically structured chat messages exchanged with the Administrator.

#### 📄 `server/models/Conversation.js`
* **Type**: Mongoose Database Schema.
* **Objective**: Powers private Direct Messages between NGO volunteers and Food Providers.
* **Key Fields**: Array of Participant references, Chronological list of message payloads, and session tracking timestamps.

---

### 🛡️ Authentication Filters (`server/middleware/`)

#### 📄 `server/middleware/auth.js`
* **Type**: Route Protection Middleware.
* **Objective**: Protects REST API routes, ensuring they can only be reached by authorized client sessions.
* **Operation**: Reads the incoming HTTP request authorization headers, validates the secret JWT key, and attaches decoded user details (`id`, `email`, `role`) directly to the request scope.

---

### 🌐 API Routings (`server/routes/`)

#### 📄 `server/routes/auth.js`
* **Type**: REST Route Handlers.
* **Objective**: Manages registration, logins, and session synchronizations.
* **Operation**:
  * `POST /register`: Encrypts passwords and creates parallel entries on MongoDB and Firebase.
  * `POST /login`: Validates credentials. Includes an integrated bypass mechanism for the designated Admin email (`adminfixhunger@gmail.com`) to allow instant admin dashboards load without external Firebase validation constraints.
  * `POST /forgot-password`: Validates account email and issues a secure 6-digit verification code sent via Ethereal or Gmail.
  * `POST /reset-password`: Verifies the 6-digit OTP code and updates the user password in MongoDB using bcrypt hashing.

#### 📄 `server/routes/users.js`
* **Type**: REST Route Handlers.
* **Objective**: User operations, Admin edits, and Contact Directory listing.
* **Operation**:
  * `PUT /profile`: Updates phone numbers, physical coordinates, and notifications.
  * `GET /contacts`: Direct messaging utility. Automatically returns matching active partners (Providers retrieve NGOs; NGOs retrieve Providers).
  * `GET /` & `PUT /:id/status`: Admin actions to search, edit, activate, or deactivate platform accounts.

#### 📄 `server/routes/donations.js`
* **Type**: REST Route Handlers.
* **Objective**: Coordinates the lifecycle of surplus food items.
* **Operation**:
  * `POST /`: Submits surplus food entries.
  * `GET /nearby`: Queries unexpired, open listings sorted by geographic proximity.
  * `PUT /:id/claim`: NGOs claim food listings.
  * `PUT /:id/status`: Updates logistics status tracking (Available -> Claimed -> Delivered).

#### 📄 `server/routes/support.js`
* **Type**: REST Route Handlers.
* **Objective**: Runs the interactive Technical Support system.
* **Operation**: Handles support ticket creations, updates, replies, and closing tickets.

#### 📄 `server/routes/chats.js`
* **Type**: REST Route Handlers.
* **Objective**: Direct messaging communications.
* **Operation**:
  * `GET /`: Lists ongoing direct conversations.
  * `GET /:userId`: Connects users, creates new message channels, and returns histories.
  * `POST /:userId`: Appends a new message to the P2P direct chat.

---

## 💻 4. Frontend Client Architecture (`src/`)

### 🧠 State Management Contexts (`src/context/`)

#### 📄 `src/context/AuthContext.tsx`
* **Type**: Global State Provider.
* **Objective**: Stores authenticated session profiles and JWT details.
* **Operation**: Auto-detects local storage credentials on load, manages logins/logouts, and provides user status parameters globally.

#### 📄 `src/context/DonationContext.tsx`
* **Type**: Global State Provider.
* **Objective**: Handles all food list coordinates, claims, and rescue updates.

#### 📄 `src/context/ChatContext.tsx`
* **Type**: Global State Provider.
* **Objective**: Manages the Direct Messaging system.
* **Operation**: Periodically polls `/api/chats` every 5 seconds to capture direct chat items and syncs conversation lists.

#### 📄 `src/context/SupportContext.tsx`
* **Type**: Global State Provider.
* **Objective**: Connects the floating drawer UI directly to support tickets.
* **Operation**: Manages issue reports, polls replies from the support administrator, and handles resolution states.

#### 📄 `src/context/AdminContext.tsx`
* **Type**: Global State Provider.
* **Objective**: Coordinates Admin metrics, user lists, and statistics.

#### 📄 `src/context/NotificationContext.tsx`
* **Type**: Global State Provider.
* **Objective**: Displays interactive toast warnings and pop-ups for critical events.

---

### 🎨 Design Layouts & Core Components (`src/components/`)

#### 📄 `src/components/ProviderLayout.tsx` & `src/components/NGOLayout.tsx`
* **Type**: Persistent Sidebars & Responsive Navs.
* **Objective**: Wraps core routes, providing side navigation panels and quick-access settings.
* **Operation**: Customizes sidebar menus based on roles, handles light/dark mode triggers, responsive overlays, and loads the floating support chat drawer.

#### 📄 `src/components/AdminLayout.tsx`
* **Type**: Persistent Admin Sidebar.
* **Objective**: Frame layout containing sidebar menus for the Admin Panel.

#### 📄 `src/components/Messages.tsx`
* **Type**: Direct Messaging Client UI.
* **Objective**: Premium split-screen chat interface.
* **Operation**: Features user profiles quick lookups, direct partner contact search modals, unread message indicators, and mobile-friendly back navigations.

#### 📄 `src/components/SupportChatWidget.tsx`
* **Type**: Floating Help Drawer.
* **Objective**: Keeps technical support questions isolated strictly for the Administrator.
* **Operation**: Floating icon in bottom-right corner. Clearly branded as **"Admin Support Chat"** to keep support requests separated from general Direct Messages.

#### 📄 `src/components/ThemeProvider.tsx` & `ThemeToggle.tsx`
* **Type**: Dark Mode Context Provider.
* **Objective**: Manages CSS theme state transitions.

---

### 📑 Routing & Shared Views

#### 📄 `src/App.tsx`
* **Type**: Main Application Router.
* **Objective**: Establishes React Router paths and nests contexts globally:
```
QueryClientProvider
└── ThemeProvider
    └── TooltipProvider
        └── AuthProvider
            └── NotificationProvider
                └── DonationProvider
                    └── AdminProvider
                        └── SupportProvider
                            └── ChatProvider
                                └── BrowserRouter
                                    └── Routes
```

---

## 📸 5. Visual System & Screenshot Placement Guide

To visually capture the core system features, please take screenshots of the live system and replace the placeholder references below. 

Recommended image location: Create a `./screenshots/` directory in the project root to host the assets.

---

### 🖼️ Screenshot Placement 1: Public Landing Page
* **Source Screen**: Access the public root URL `http://localhost:5173/` before logging in.
* **Placeholder**:
  ![Public Landing Page Overview](./screenshots/landing_page.png)
  *(Description: Captures the modern dark/light landing layout, navigation, hero banner, and key features overview.)*

---

### 🖼️ Screenshot Placement 2: User Authentication Portal
* **Source Screen**: Access `http://localhost:5173/login` or `/signup`.
* **Placeholder**:
  ![Authentication Portal](./screenshots/auth_portal.png)
  *(Description: Captures the premium, clean glassmorphic signup and login forms.)*

---

### 🖼️ Screenshot Placement 3: Food Provider Dashboard
* **Source Screen**: Log in as a Provider and open `http://localhost:5173/provider/dashboard`.
* **Placeholder**:
  ![Provider Operations Dashboard](./screenshots/provider_dashboard.png)
  *(Description: Shows listed active surplus items, claim logs, donor rankings, and total items rescued.)*

---

### 🖼️ Screenshot Placement 4: AI Voice & Camera Donation Listing
* **Source Screen**: Open `http://localhost:5173/provider/donate`.
* **Placeholder**:
  ![Surplus Food Listing Form](./screenshots/donate_food_form.png)
  *(Description: Captures the listing form showcasing voice description capture and AI-assisted food item scan.)*

---

### 🖼️ Screenshot Placement 5: NGO Rescue Dashboard
* **Source Screen**: Log in as an NGO and navigate to `http://localhost:5173/ngo/dashboard`.
* **Placeholder**:
  ![NGO Rescue Dashboard Overview](./screenshots/ngo_dashboard.png)
  *(Description: Displays nearby listings summary, pending food collections, and volunteer stats.)*

---

### 🖼️ Screenshot Placement 6: Nearby Proximity Radar Map
* **Source Screen**: Navigate to `http://localhost:5173/ngo/nearby`.
* **Placeholder**:
  ![Nearby Proximity Radar Map](./screenshots/nearby_donations_map.png)
  *(Description: Shows active local food locations, coordinate circles, and the Leaflet Map interface.)*

---

### 🖼️ Screenshot Placement 7: Direct Messaging Chat System
* **Source Screen**: Access `http://localhost:5173/provider/messages` or `/ngo/messages`.
* **Placeholder**:
  ![Direct Message Interface](./screenshots/direct_messages_chat.png)
  *(Description: Displays the dual-pane P2P direct chat, contact lookup modal, and messages list.)*

---

### 🖼️ Screenshot Placement 8: Floating Admin Support Widget
* **Source Screen**: Click the floating chat button in the bottom-right corner of any user dashboard.
* **Placeholder**:
  ![Admin Support Chat Widget](./screenshots/admin_support_widget.png)
  *(Description: Shows the isolated Admin Support chat drawer.)*

---

### 🖼️ Screenshot Placement 9: Admin Dashboard Overview
* **Source Screen**: Log in as Admin (`adminfixhunger@gmail.com`) and open `http://localhost:5173/admin/dashboard`.
* **Placeholder**:
  ![Admin Operations Hub](./screenshots/admin_dashboard.png)
  *(Description: Displays global system stats, active users count, and donation status metrics.)*

---

### 🖼️ Screenshot Placement 10: Admin User Directory Control
* **Source Screen**: Navigate to `http://localhost:5173/admin/users`.
* **Placeholder**:
  ![Admin User Directory Management](./screenshots/user_directory_management.png)
  *(Description: Displays the user grid with activation/deactivation triggers and profile details drawer.)*

---

### 🖼️ Screenshot Placement 11: Real-time Donation Hotspots Heatmap
* **Source Screen**: Navigate to `http://localhost:5173/admin/analytics`.
* **Placeholder**:
  ![Real-time Donation Hotspots Heatmap](./screenshots/hotspots_heatmap.png)
  *(Description: Captures user distribution map with colored markers: green, blue, purple, and red, along with the map legend.)*

---

### 🖼️ Screenshot Placement 12: Admin Support Requests Ticket Desk
* **Source Screen**: Navigate to `http://localhost:5173/admin/support`.
* **Placeholder**:
  ![Admin Support Requests Ticket Center](./screenshots/support_tickets_management.png)
  *(Description: Shows the technical desk where administrators manage and reply to user tickets.)*
