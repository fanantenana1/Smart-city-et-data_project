# SmartWaste AI Coding Agent Instructions

## Project Overview
SmartWaste is a **full-stack IoT waste management system** with real-time monitoring. It comprises:
- **Backend**: FastAPI + MongoDB + WebSocket (Python)
- **Frontend**: React + Axios + Tailwind CSS (JavaScript)
- **Infrastructure**: Docker, ESP32 IoT devices, email alerts

Key architectural decision: **Graceful degradation** - MongoDB + JSON fallback caching in memory allows offline functionality.

---

## Backend Architecture (Python/FastAPI)

### Entry Point & Structure
- `backend/app/main.py` - FastAPI app with 768 lines: CORS setup, auth (JWT), bin CRUD, alerts, WebSocket, user management
- `backend/app/database.py` - Hybrid MongoDB/JSON persistence with in-memory cache (`_cache` dict)
- `backend/app/send.py` - Async email alerts for critical bins
- `backend/start.py` - Entry point (runs `uvicorn app.main:app`)

### Critical Data Flow
```
Client Request → CORS Middleware → JWT Auth (if needed) → DB Layer
DB Layer: Check MongoDB → Cache to _cache dict → Return JSON Response
Updates: Write to MongoDB AND update _cache (dual-write pattern)
```

### Database Layer Pattern
**Read flow**: 
```python
user = db_get_user(username)  # Reads from _cache['users']
```
**Write flow**: 
```python
db_update_user(username, {data})  # Updates _cache + MongoDB
users_collection = get_users_collection()  # Opens MongoDB connection
users_collection.update_one(...)  # Persists to MongoDB
```

**MongoDB URI Management**: Read from `backend/cle.txt` line by line (format: `clé: mongodb+srv://...`). Credentials auto-encode special chars using `quote_plus()`.

### Authentication & Authorization
- **JWT**: 24-hour tokens created via `create_access_token({"sub": username, "role": role})`
- **Roles**: `admin`, `collector`, `simple_user` (decoded in DashboardRouter on frontend)
- **Approval workflow**: User has `is_approved` flag; unapproved users get 403 error "Account not approved yet"
- **Dependency injection**: `jwt_required` dependency extracts token and validates

### Key Pydantic Models
```python
UserResponse = {username, email, full_name, role, is_active, is_approved}
LoginResponse = {access_token, token_type, user: UserResponse}
BinData = {bin_id, location, fill_level, capacity, battery, temperature, ...}
```
**Critical**: Always define `response_model` on endpoints for proper JSON serialization (avoids `password_hash` leaks).

### WebSocket Real-Time Updates
- `/ws/bins` endpoint for live bin status streaming
- Uses `ConnectionManager` pattern to broadcast updates
- Gracefully handles disconnections and reconnects

### Common Workflows

**Adding a new API endpoint**:
1. Define Pydantic model in `main.py`
2. Create database helper in `database.py` (updates _cache + MongoDB)
3. Add `@app.get/post/put/delete()` with `response_model` type hint
4. Import DB function and call it
5. Test via `curl` or frontend before deploying

**Debugging MongoDB issues**:
- Check `backend/cle.txt` format (should be `clé: mongodb+srv://...`)
- Verify credentials are URL-encoded (special chars like `@` become `%40`)
- Check MongoDB Atlas network access rules (allow 0.0.0.0/0 for dev)
- Fallback to JSON works if MongoDB connection fails

---

## Frontend Architecture (React)

### Core Setup
- `src/App.jsx` - Root router with role-based dashboard selection
- `src/api.js` - Axios instance with automatic Bearer token injection + error logging
- `src/config.js` - Centralized API URL config (auto-detects `localhost` vs network IP)
- `src/components/` - 24 UI components (pages + shared widgets)

### API Communication Pattern
```javascript
// api.js sets up axios with interceptors
api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('sw_token')}`;
  return config;
});

// Frontend calls use helper functions
const res = await postLogin(username, password);
localStorage.setItem('sw_token', res.data.access_token);
navigate('/dashboard');
```

### Authentication Flow
1. User submits login form in `LoginPage.jsx`
2. `postLogin()` sends POST to `/api/auth/login`
3. Backend returns `{access_token, user: {role, ...}}`
4. Frontend stores token + navigates to dashboard
5. `DashboardRouter` decodes JWT payload to get role → renders Admin or SimpleUser dashboard

**Token decoding** (client-side, for UI logic only):
```javascript
const payload = JSON.parse(atob(token.split('.')[1])); // Get JWT payload
const isAdmin = payload.role === 'admin'; // Use for conditional rendering
```

### Dynamic IP Configuration
`src/config.js` auto-detects hostname. For multi-machine setups:
```javascript
// Manually set IP to 192.168.1.100 (for ESP32/devices on same network)
setLocalIP('192.168.1.100');
```

### Component Organization
- **Pages** (full-screen): `LoginPage`, `Dashboard`, `MapPage`, `ReportsPage`
- **Managed pages**: `BinsCrudPage` (create/edit/delete bins), `UserManagementPage`
- **Dashboards**: `SmartWasteDashboard` (admin) vs `SimpleUserDashboard` (operators)
- **Shared**: `Header`, `Footer`, `MetricCard` (reusable stats card)

### Common Workflows

**Fetching data**:
```javascript
import { api, fetchBins } from '../api';
const { data } = await fetchBins(); // Auto-includes Bearer token
```

**Displaying alerts**:
```javascript
const { data: alerts } = await fetchAlerts();
// Alerts have types: 'urgent' (red), 'important' (orange), 'info' (blue)
```

**WebSocket connection** (real-time updates):
```javascript
// In components/services/websocket.js - singleton manager
const socket = new WebSocket(`ws://localhost:8000/ws/bins`);
socket.onmessage = (event) => { /* update UI */ };
```

---

## Common Integration Points

### API Response Contracts
All responses follow this pattern:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "username": "admin", "role": "admin", ... }
}
```

For errors:
```json
{ "detail": "Invalid credentials" }  // Status 401
{ "detail": "Account not approved yet" }  // Status 403
```

### Bin Status States
```
"normal" (0-70%)   → Green
"attention" (71-89%) → Yellow
"critical" (90%+)  → Red
"offline"          → Gray
```

### User Roles & Permissions
| Role | Bins | Alerts | Users | Reports |
|------|------|--------|-------|---------|
| admin | ✅ CRUD | ✅ View | ✅ Manage | ✅ Full |
| collector | ✅ View | ✅ View | ❌ | ❌ |
| simple_user | ✅ View | ✅ View | ❌ | ✅ Own |

---

## Development Commands

```bash
# Backend (Python 3.8+)
cd backend
pip install -r requirements.txt
python start.py  # Runs on http://localhost:8000

# Frontend (Node 14+)
cd frontend
npm install
npm start  # Runs on http://localhost:3000

# Insert sample data
python backend/insert_sample_data.py  # Populates MongoDB

# Docker (both services)
docker-compose up  # Backend on 8000, Frontend on 3001
```

---

## Project-Specific Conventions

1. **In-memory cache first**: Database layer reads from `_cache` dict, syncs with MongoDB asynchronously
2. **Error detail strings**: Always return meaningful messages in `HTTPException(detail="...")` for frontend UX
3. **URL encoding credentials**: MongoDB URI credentials auto-encode `@` and `:` chars
4. **Token storage**: Use `localStorage.setItem('sw_token', token)` (key name matters for api.js interceptor)
5. **Component styling**: Tailwind CSS + custom CSS modules (e.g., `Dashboard.css` alongside `Dashboard.jsx`)
6. **Async email**: Alerts trigger `send_alert_email_async()` without blocking response

---

## Debugging Checklist

**"Network Error" on login**:
- ✅ Backend running on port 8000? (`python start.py`)
- ✅ Frontend running on port 3000? (`npm start`)
- ✅ CORS enabled in `main.py` (allow_origins=["*"])
- ✅ MongoDB connected? Check `backend/cle.txt` format and credentials
- ✅ Frontend config.js using correct IP/port? (auto-detect or `setLocalIP()`)

**MongoDB connection fails**:
- Check `backend/cle.txt` exists and has line starting with "clé: mongodb+srv://"
- Verify credentials don't have unencoded special chars (should be URL-encoded)
- Check MongoDB Atlas firewall allows your IP (or 0.0.0.0/0 for dev)
- Check database name matches `MONGO_DB_NAME = 'DaB_Poubelles'`

**User not approved error**:
- Run `insert_sample_data.py` to seed approved users (user1 is approved, user2 is not)
- Check `is_approved` field in MongoDB `users` collection

---

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `backend/app/main.py` | FastAPI routes + auth | 797 |
| `backend/app/database.py` | MongoDB + cache layer | 456 |
| `frontend/src/api.js` | Axios client + interceptors | 75 |
| `frontend/src/config.js` | API URL config | 77 |
| `frontend/src/App.jsx` | Root router + role-based dashboard | 44 |
| `backend/cle.txt` | MongoDB connection string | 3 |
| `insert_sample_data.py` | Seed script | 300 |

---

## Environment Variables (Optional)

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/...  # Override cle.txt
MONGODB_DB=DaB_Poubelles  # Database name (default)
MONGODB_COLLECTION=poubelles  # Bins collection (default)
REACT_APP_API_BASE=http://192.168.1.100:8000  # Frontend API target
REACT_APP_DEBUG=true  # Enable api.js logging
```
