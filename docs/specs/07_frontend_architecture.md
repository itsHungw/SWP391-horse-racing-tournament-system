# Frontend Architecture Specification (React + Tailwind CSS)

---

## 1. Layered Architecture

```
┌─────────────────────────────────────────────┐
│                  Pages                      │
│   Route-level components, layout wrappers   │
│   CHỈ compose Components + gọi Hooks        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│               Components                    │
│   Reusable UI blocks                        │
│   KHÔNG chứa API call trực tiếp             │
│   Nhận data qua props hoặc hooks            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Hooks (Custom)                   │
│   Business logic + state management         │
│   Gọi Services để fetch/mutate data         │
│   Quản lý loading/error states              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Services (API Layer)              │
│   Axios calls to backend REST API           │
│   KHÔNG chứa UI logic                       │
│   Return raw data / throw errors            │
└──────────────────┬──────────────────────────┘
                   │ HTTP / JSON
┌──────────────────▼──────────────────────────┐
│          Spring Boot Backend                │
└─────────────────────────────────────────────┘
```

---

## 2. Strict Layer Rules

### ❌ FORBIDDEN

| Rule | Mô tả |
|------|--------|
| F-01 | Page/Component **KHÔNG ĐƯỢC** gọi Axios/fetch trực tiếp |
| F-02 | Component **KHÔNG ĐƯỢC** chứa business logic phức tạp |
| F-03 | Service **KHÔNG ĐƯỢC** chứa React state/hooks |
| F-04 | Service **KHÔNG ĐƯỢC** import React components |
| F-05 | Component **KHÔNG ĐƯỢC** access localStorage trực tiếp (dùng AuthContext) |

### ✅ REQUIRED

| Rule | Mô tả |
|------|--------|
| R-01 | Mọi API call PHẢI qua Service layer |
| R-02 | Mọi business logic PHẢI trong Custom Hooks |
| R-03 | Pages CHỈ compose Components + dùng Hooks |
| R-04 | Components PHẢI nhận data qua props hoặc context |
| R-05 | Protected routes PHẢI dùng RouteGuard component |

---

## 3. Folder Structure

```
frontend/src/
│
├── api/                           # Service layer (API calls)
│   ├── axiosConfig.js             # Axios instance + interceptors
│   ├── authApi.js                 # Auth endpoints
│   ├── userApi.js                 # User endpoints
│   ├── roleRequestApi.js         # Role request endpoints
│   ├── horseApi.js                # Horse endpoints
│   ├── tournamentApi.js           # Tournament endpoints
│   ├── raceApi.js                 # Race endpoints
│   ├── invitationApi.js           # Jockey invitation endpoints
│   ├── refereeApi.js              # Referee endpoints
│   ├── resultApi.js               # Result endpoints
│   ├── rankingApi.js              # Ranking endpoints
│   ├── predictionApi.js           # Prediction endpoints
│   ├── notificationApi.js         # Notification endpoints
│   ├── fileApi.js                 # File upload endpoints
│   └── adminApi.js                # Admin-specific endpoints
│
├── components/                    # Reusable UI components
│   ├── common/                    # Shared across all roles
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── DataTable.jsx
│   │   ├── Pagination.jsx
│   │   ├── Modal.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── Toast.jsx
│   │   ├── SearchBar.jsx
│   │   ├── FileUpload.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── auth/                      # Auth-related
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ChangePasswordForm.jsx
│   │
│   ├── horse/                     # Horse-related
│   │   ├── HorseCard.jsx
│   │   ├── HorseForm.jsx
│   │   ├── HorseDetail.jsx
│   │   └── HorseList.jsx
│   │
│   ├── tournament/                # Tournament-related
│   │   ├── TournamentCard.jsx
│   │   ├── TournamentDetail.jsx
│   │   └── TournamentForm.jsx
│   │
│   ├── race/                      # Race-related
│   │   ├── RaceCard.jsx
│   │   ├── RaceDetail.jsx
│   │   ├── ParticipantList.jsx
│   │   └── ResultTable.jsx
│   │
│   ├── prediction/
│   │   ├── PredictionForm.jsx
│   │   └── PredictionHistory.jsx
│   │
│   ├── notification/
│   │   ├── NotificationBell.jsx
│   │   └── NotificationList.jsx
│   │
│   └── dashboard/
│       ├── StatCard.jsx
│       ├── RecentActivity.jsx
│       └── QuickActions.jsx
│
├── hooks/                         # Custom hooks (business logic)
│   ├── useAuth.js                 # Login, logout, register
│   ├── useCurrentUser.js          # Get current user info
│   ├── useHorses.js               # Horse CRUD operations
│   ├── useTournaments.js          # Tournament operations
│   ├── useRaces.js                # Race operations
│   ├── useInvitations.js          # Jockey invitations
│   ├── usePredictions.js          # Predictions
│   ├── useNotifications.js        # Notifications
│   ├── useRoleRequests.js         # Role request operations
│   ├── usePagination.js           # Pagination state
│   ├── useDebounce.js             # Debounce for search
│   └── useFileUpload.js           # File upload logic
│
├── contexts/                      # React Context providers
│   ├── AuthContext.jsx            # Auth state + JWT token
│   ├── NotificationContext.jsx    # Notification count
│   └── ToastContext.jsx           # Toast messages
│
├── pages/                         # Route-level pages
│   ├── public/                    # No auth required
│   │   ├── HomePage.jsx
│   │   ├── TournamentListPage.jsx
│   │   ├── TournamentDetailPage.jsx
│   │   ├── RaceDetailPage.jsx
│   │   ├── HorsePublicPage.jsx
│   │   ├── RankingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   │
│   ├── spectator/                 # SPECTATOR role
│   │   ├── ProfilePage.jsx
│   │   ├── PredictionsPage.jsx
│   │   ├── NewPredictionPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── RoleRequestsPage.jsx
│   │   ├── ApplyOwnerPage.jsx
│   │   ├── ApplyJockeyPage.jsx
│   │   └── ApplyRefereePage.jsx
│   │
│   ├── owner/                     # HORSE_OWNER role
│   │   ├── OwnerDashboardPage.jsx
│   │   ├── MyHorsesPage.jsx
│   │   ├── CreateHorsePage.jsx
│   │   ├── EditHorsePage.jsx
│   │   ├── MyRegistrationsPage.jsx
│   │   └── MyInvitationsPage.jsx
│   │
│   ├── jockey/                    # JOCKEY role
│   │   ├── JockeyDashboardPage.jsx
│   │   ├── JockeyInvitationsPage.jsx
│   │   ├── JockeyRacesPage.jsx
│   │   └── JockeyResultsPage.jsx
│   │
│   ├── referee/                   # REFEREE role
│   │   ├── RefereeDashboardPage.jsx
│   │   ├── AssignedRacesPage.jsx
│   │   ├── RaceCheckPage.jsx
│   │   ├── ViolationsPage.jsx
│   │   ├── ReportPage.jsx
│   │   └── SubmitResultPage.jsx
│   │
│   └── admin/                     # ADMIN role
│       ├── AdminDashboardPage.jsx
│       ├── UserManagementPage.jsx
│       ├── RoleRequestsPage.jsx
│       ├── HorseManagementPage.jsx
│       ├── TournamentManagementPage.jsx
│       ├── RaceManagementPage.jsx
│       ├── RegistrationApprovalPage.jsx
│       ├── ResultManagementPage.jsx
│       ├── RankingsPage.jsx
│       └── PredictionsOverviewPage.jsx
│
├── routes/                        # Routing configuration
│   ├── AppRouter.jsx              # Main router
│   ├── ProtectedRoute.jsx         # Auth guard
│   └── RoleRoute.jsx              # Role-based guard
│
├── layouts/                       # Layout wrappers
│   ├── PublicLayout.jsx           # Header + Footer
│   ├── AuthLayout.jsx             # Centered card
│   ├── DashboardLayout.jsx        # Sidebar + Header + Content
│   └── AdminLayout.jsx            # Admin sidebar + Header
│
├── utils/                         # Utility functions
│   ├── formatDate.js
│   ├── formatCurrency.js
│   ├── statusColors.js            # Status → Tailwind color mapping
│   ├── validators.js              # Form validation helpers
│   └── constants.js               # App constants
│
├── assets/                        # Static assets
│   ├── images/
│   └── icons/
│
├── App.jsx                        # Root component
├── main.jsx                       # Entry point
└── index.css                      # Tailwind imports
```

---

## 4. Axios Configuration

```javascript
// api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

---

## 5. Route Guard Pattern

```jsx
// routes/RoleRoute.jsx
const RoleRoute = ({ roles, children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) return <Navigate to="/login" />;

  const userRoles = user.roles.map(r => r.name);
  const hasRole = roles.some(role => userRoles.includes(role));

  if (!hasRole) return <Navigate to="/unauthorized" />;

  return children;
};

// Usage in AppRouter:
<Route path="/owner/*"
  element={
    <RoleRoute roles={['HORSE_OWNER']}>
      <DashboardLayout><Outlet /></DashboardLayout>
    </RoleRoute>
  }
/>
```
