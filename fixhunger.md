# 🍽️ Fix Hunger - Full Project Documentation

Fix Hunger is a community-driven, real-time food rescue and surplus donation platform designed to bridge the gap between **Food Providers** (Restaurants, Bakeries, Event Organizers) and **NGO Volunteers** (Rescue teams, Volunteers). It includes an integrated **Admin Panel** for auditing, analytics, user management, and technical support.

This document provides a highly detailed, comprehensive structural and functional walkthrough of **every single key file, component, model, context, and route** in the codebase.

---

## 🛠️ Technology Stack
* **Frontend**: React.js with TypeScript, Vite (bundler), Tailwind CSS (styling), Radix UI (accessible design primitives), Lucide React (icons), and Leaflet (maps).
* **Backend**: Node.js, Express.js (mounted on Vercel Serverless `/api`), and Mongoose (ODM).
* **Database**: MongoDB (user accounts, chats, tickets, donations) and Firebase Auth (for cross-client session tracking).

---

## 📁 1. Project Directory Structure
```
fix-hunger/
├── api/                   # Main Express.js backend server entry (Vercel deployment)
├── server/                # Express Backend Core logic
│   ├── middleware/        # Authentication & security middleware
│   ├── models/            # MongoDB Schema definitions
│   ├── routes/            # API Route endpoints
│   └── utils/             # Helper utilities (Email, etc.)
├── src/                   # Frontend Client Core
│   ├── components/        # Shared components, sidebars, theme and widgets
│   ├── context/           # React Context Providers (State Management)
│   ├── hooks/             # Custom React Hooks
│   ├── lib/               # API clients, helpers, and configurations
│   ├── pages/             # Frontend Dashboard & Public pages
│   ├── App.tsx            # Main Route configuration and Providers
│   └── main.tsx           # Client entry point
└── config files           # Tailwind, Vite, TypeScript, and Git configs
```

---

## 🧱 2. Backend Architecture (`server/` & `api/`)

### 🔑 Entry Server File
#### 📄 `api/index.js`
* **Kya Hai**: Core Express app instance that starts local listeners or exports serverless handlers.
* **Kyu Use Kiya**: It is the single gateway of our backend API. It establishes connection caching with MongoDB (`mongoose.connect`), manages request parsers/CORS, mounts routes under `/api`, and integrates Gemini AI analysis endpoints.
* **Functionality**:
  * `/api/ai/analyze-food`: Accepts a base64 image of food, sends it to Gemini API, and instantly identifies food type, category, and shelf life.
  * `/api/ai/chat`: Powered by Gemini to answer rescue volunteer queries based on current local pending donations.

---

### 🗄️ MongoDB Models (`server/models/`)

#### 📄 `server/models/User.js`
* **Kya Hai**: MongoDB user representation.
* **Kyu Use Kiya**: Binds authentication records to profile structures.
* **Functionality**: Stores credentials, role types (`Admin`, `NGO`, `Provider`), custom fields (like `orgName` for Providers, `vehicleType` for NGOs), active markers (`isActive`), location coordinates (`lat`, `lng`), and individual preferences (like push notifications, volunteer tracking, and daily summary).

#### 📄 `server/models/Donation.js`
* **Kya Hai**: Surplus food database schema.
* **Kyu Use Kiya**: Track listed surplus food items, their locations, and availability statuses.
* **Functionality**: Stores donor ID reference, food item specs (name, quantity, shelf life, photo), pickup address, coordinates, and status tracks (`Available`, `Claimed`, `Delivered`, `Expired`).

#### 📄 `server/models/Ticket.js`
* **Kya Hai**: Customer care support tickets.
* **Kyu Use Kiya**: Connects users directly to the platform administrators for quick troubleshooting.
* **Functionality**: Stores user ID references, roles, ticket status (`Open`/`Closed`), and an array of individual messages exchanged between user and Admin.

#### 📄 `server/models/Conversation.js`
* **Kya Hai**: Private Direct Messaging database schema.
* **Kyu Use Kiya**: Facilitates dedicated P2P communications specifically between NGOs and Providers.
* **Functionality**: Contains participant references and chronological direct message objects (sender, receiver, text, timestamp).

---

### 🛡️ Middleware (`server/middleware/`)

#### 📄 `server/middleware/auth.js`
* **Kya Hai**: Secure JWT authentication verifier.
* **Kyu Use Kiya**: Restricts sensitive APIs to authenticated users.
* **Functionality**: Extracts the Bearer token from request headers, decodes the JWT using the secret key, and binds the decrypted user ID, email, and role directly to the incoming request payload (`req.user`).

---

### 🌐 Backend Routes (`server/routes/`)

#### 📄 `server/routes/auth.js`
* **Kya Hai**: User credentials manager.
* **Kyu Use Kiya**: Powers onboarding and user logins.
* **Functionality**: 
  * `POST /register`: Registers user profiles on both MongoDB and Firebase.
  * `POST /login`: Validates password hashes (via bcrypt) and issues secure JWT sessions. Includes an instant bypass mechanism for the Admin login email (`adminfixhunger@gmail.com`) to bypass Firebase constraints.

#### 📄 `server/routes/users.js`
* **Kya Hai**: User directory controller.
* **Kyu Use Kiya**: Profile settings and admin directory audits.
* **Functionality**:
  * `PUT /profile`: Persists custom setting preferences.
  * `GET /contacts`: Securely queries active, verified contacts (returns active NGOs to Providers, and active Providers to NGOs).
  * `GET /` & `PUT /:id/status`: Admin routes for searching, editing, and toggling user roles/activity statuses.

#### 📄 `server/routes/donations.js`
* **Kya Hai**: Donation lifecycle management.
* **Kyu Use Kiya**: Handles surplus listings, claiming, and delivery logs.
* **Functionality**:
  * `POST /`: Lists new surplus donation details.
  * `GET /nearby`: Returns active, unexpired donations sorted by proximity.
  * `PUT /:id/claim`: Lets an NGO reserve a donation.
  * `PUT /:id/status`: Updates tracking logs (Available -> Claimed -> Delivered).

#### 📄 `server/routes/support.js`
* **Kya Hai**: Admin Support channels.
* **Kyu Use Kiya**: Coordinates error reporting and assistance between users and Admin.
* **Functionality**: Allows users to post queries to create a support thread, lists active tickets for Admins, and permits both parties to post replies and close tickets.

#### 📄 `server/routes/chats.js`
* **Kya Hai**: P2P messages pipeline.
* **Kyu Use Kiya**: Connects Providers and NGOs directly.
* **Functionality**:
  * `GET /`: Lists ongoing direct conversations.
  * `GET /:userId`: Checks if a thread exists with a participant, creates one if missing, and loads the history.
  * `POST /:userId`: Posts a new direct message into the chronological thread.

---

## 💻 3. Frontend Architecture (`src/`)

### 🧠 React State Management (`src/context/`)

#### 📄 `src/context/AuthContext.tsx`
* **Kya Hai**: Account verification manager.
* **Kyu Use Kiya**: Holds the global state of the logged-in user, their JWT, role profile, and token refresh routines.
* **Functionality**: Automatically parses active local storage tokens on startup, validates status, logs users in/out, and supplies user profile references to all components.

#### 📄 `src/context/DonationContext.tsx`
* **Kya Hai**: Live donations dispatcher.
* **Kyu Use Kiya**: Synchronizes available food listings, proximity lists, and historical claims.
* **Functionality**: Tracks food details, fetches available foods list, triggers claim actions, and persists NGO pickup logs.

#### 📄 `src/context/ChatContext.tsx`
* **Kya Hai**: Direct Messaging pipeline context.
* **Kyu Use Kiya**: Manages private direct chats, chat lists, active participant records, and message deliveries.
* **Functionality**: Polls `/api/chats` every 5 seconds to keep direct messaging in real-time, selects contacts, and sends messages.

#### 📄 `src/context/SupportContext.tsx`
* **Kya Hai**: Support Desk context.
* **Kyu Use Kiya**: Feeds support tickets, active conversations, and replies to the floating widget.
* **Functionality**: Polls support messages from `/api/support` to alert the user of new replies from the administrator.

#### 📄 `src/context/AdminContext.tsx`
* **Kya Hai**: Control center state manager.
* **Kyu Use Kiya**: Handles Admin user management grids, system monitoring logs, and analytics.
* **Functionality**: Synchronizes database users, manages updates/deletions, registers activation/deactivation triggers, and fetches global analytics metrics.

#### 📄 `src/context/NotificationContext.tsx`
* **Kya Hai**: Alert dispatcher.
* **Kyu Use Kiya**: Pushes responsive system alerts (e.g. "New Donation Available Nearby!").
* **Functionality**: Displays toast notifications and custom badges when users post, claim, or complete rescue events.

---

### 🎨 Reusable & Layout Components (`src/components/`)

#### 📄 `src/components/ProviderLayout.tsx` & `src/components/NGOLayout.tsx`
* **Kya Hai**: Role-based responsive layouts.
* **Kyu Use Kiya**: Side navigation frames, quick menu items, and responsive wrappers.
* **Functionality**: Contains sideboards, role indicators, Dark/Light quick toggle, mobile headers, and mounts the floating Admin Support Chat widget.

#### 📄 `src/components/AdminLayout.tsx`
* **Kya Hai**: Admin dashboard frame.
* **Kyu Use Kiya**: Manages admin panel side nav and header actions.
* **Functionality**: Side navigation for Admin Dashboard, User Management, Donations, Support Tickets, Analytics, Profile, and Settings.

#### 📄 `src/components/Messages.tsx`
* **Kya Hai**: Unified Direct Messaging Panel.
* **Kyu Use Kiya**: Renders the complete, responsive dual-pane chat system.
* **Functionality**: Displays active conversations, provides a Modal search box to select verified contacts, lists message bubbles, and supports mobile back navigation.

#### 📄 `src/components/SupportChatWidget.tsx`
* **Kya Hai**: Floating ticket drawer.
* **Kyu Use Kiya**: Acts as a dedicated gateway for users to contact support.
* **Functionality**: Floating icon in bottom-right corner that launches an interactive dialog titled "Admin Support Chat" to exchange help text with support.

#### 📄 `src/components/ThemeProvider.tsx` & `ThemeToggle.tsx`
* **Kya Hai**: System theme coordinator.
* **Kyu Use Kiya**: Saves and sets light and dark styles.
* **Functionality**: Integrates Tailwind classes to swap dark mode states globally, persists preference in local storage, and provides a sleek toggle button.

---

### 📑 Dashboard & Views (`src/pages/`)

#### 📄 `src/pages/Index.tsx`
* **Kya Hai**: Core public landing page.
* **Kyu Use Kiya**: Introduces visitors to "Fix Hunger" and prompts call-to-actions.

#### 📄 `src/pages/Login.tsx` & `Signup.tsx` & `ForgotPassword.tsx`
* **Kya Hai**: Authentication screens.
* **Kyu Use Kiya**: Registers users and initiates valid sessions.

#### 📄 `src/pages/NotFound.tsx`
* **Kya Hai**: Error fallback screen.
* **Kyu Use Kiya**: Handles broken links with an elegant redirect mechanism.

---

### 🧑‍🍳 Food Provider Area (`src/pages/provider/`)

#### 📄 `src/pages/provider/Dashboard.tsx`
* **Kya Hai**: Provider hub.
* **Kyu Use Kiya**: Summary of listed active foods, status of claims, and live metrics.
* **Functionality**: Displays active donation summaries, quick listing shortcut, and claims history.

#### 📄 `src/pages/provider/DonateFood.tsx`
* **Kya Hai**: Voice & Image assisted donation page.
* **Kyu Use Kiya**: Streamlines creating new food lists.
* **Functionality**: Integrates voice-recognition for description inputs, local camera captures, and triggers Gemini AI to automatically fill shelf-life and categories.

#### 📄 `src/pages/provider/DonationHistory.tsx`
* **Kya Hai**: Archive portal.
* **Kyu Use Kiya**: Historical records of all past surplus items.

#### 📄 `src/pages/provider/ProviderSettings.tsx`
* **Kya Hai**: Profile setting panels.
* **Kyu Use Kiya**: Syncs name, organization type, location address, and map coordinates.

---

### 🛡️ NGO Rescue Volunteer Area (`src/pages/ngo/`)

#### 📄 `src/pages/ngo/Dashboard.tsx`
* **Kya Hai**: NGO mission control.
* **Kyu Use Kiya**: Displays local statistics, active claims, and recent rescue reports.

#### 📄 `src/pages/ngo/NearbyDonations.tsx`
* **Kya Hai**: Proximity Radar.
* **Kyu Use Kiya**: Shows nearby listings on an interactive leaflet map.
* **Functionality**: Highlights surplus listings in real-time, displays details, and permits claiming them.

#### 📄 `src/pages/ngo/DonationDetail.tsx`
* **Kya Hai**: Item audit panel.
* **Kyu Use Kiya**: Shows details of the donation, donor address, location, and path coordinate mappings.

#### 📄 `src/pages/ngo/History.tsx`
* **Kya Hai**: Volunteer logs.
* **Kyu Use Kiya**: List of all claimed, picked up, and successfully distributed orders.

#### 📄 `src/pages/ngo/Profile.tsx`
* **Kya Hai**: Settings portal.
* **Kyu Use Kiya**: Customizes name, vehicle details, tracking choices, and profile info.

#### 📄 `src/pages/ngo/RescueAssistant.tsx`
* **Kya Hai**: Gemini AI powered assistant.
* **Kyu Use Kiya**: NGO volunteer assistant chat.
* **Functionality**: Gives recommendations and logistics support based on actual pending listings.

---

### 🛡️ Administrator Panel (`src/pages/admin/`)

#### 📄 `src/pages/admin/Dashboard.tsx`
* **Kya Hai**: System supervisor center.
* **Kyu Use Kiya**: Core global metrics (Total Active Providers, NGOs, active donations, system health).

#### 📄 `src/pages/admin/UserManagement.tsx`
* **Kya Hai**: User directory control.
* **Kyu Use Kiya**: System audit tools for users.
* **Functionality**: Displays structured users grid, features user profile drawers showing historical donations (Providers) or pickups (NGOs), handles updates, and deactivates/deletes users.

#### 📄 `src/pages/admin/DonationMonitoring.tsx`
* **Kya Hai**: Inventory radar.
* **Kyu Use Kiya**: Track active and historical listings.

#### 📄 `src/pages/admin/Analytics.tsx`
* **Kya Hai**: Hotspot Heatmap & Analytics.
* **Kyu Use Kiya**: Interactive map representing user distributions and hot-spots.
* **Functionality**: Plots color-coded pins: **Green** (Available Surplus), **Purple** (NGO Rescuers), **Blue** (Providers), and **Red** (Deactivated accounts), with a responsive legend.

#### 📄 `src/pages/admin/SupportRequests.tsx`
* **Kya Hai**: Admin support desk.
* **Kyu Use Kiya**: Interface to monitor, reply, and close incoming technical support tickets.

#### 📄 `src/pages/admin/AdminProfile.tsx` & `AdminSettings.tsx`
* **Kya Hai**: Admin settings.
* **Kyu Use Kiya**: Customize Admin account credentials and settings.

---

## 🚀 How Everything Runs

### 1. App Startup (Routing & Providers)
`src/App.tsx` initializes and nests the core provider elements:
```
QueryClientProvider (API state caching)
└── ThemeProvider (Dark / Light toggle framework)
    └── TooltipProvider (Standard Radix overlays)
        └── AuthProvider (User sessions)
            └── NotificationProvider (Toasts & alerts)
                └── DonationProvider (Nearby listings)
                    └── AdminProvider (Global users database)
                        └── SupportProvider (Technical desk)
                            └── ChatProvider (Direct NGO <-> Provider chats)
                                └── BrowserRouter (React Router configuration)
```

### 2. P2P Direct Chat Operations Flow
```
[Provider / NGO Messages Screen]
       │
       ├──► Searches/Selects Chat Contact (GET /api/users/contacts)
       │
       ├──► Loads Conversation Thread (GET /api/chats/:userId)
       │
       ├──► Sends message (POST /api/chats/:userId)
       │
       └──► Polling loop (GET /api/chats) every 5 seconds updates thread
```

### 3. Support Operations Flow
```
[User Dashboard floating support drawer]
       │
       ├──► Type Issue & Send (POST /api/support)
       │
       ├──► Admin reads & replies (POST /api/support/:id/reply)
       │
       └──► Polling loop (GET /api/support) keeps drawer updated in real-time
```
