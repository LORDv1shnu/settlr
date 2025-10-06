# Settlr - Authentication & Database Setup

## What I've Implemented

### 1. PostgreSQL Database Integration ✅
- Database setup script (`setup-postgres.ps1`)
- Database viewer script (`view-users.ps1`)
- Users are stored in PostgreSQL with plaintext passwords (demo only)

### 2. Login System ✅
- Email/password authentication
- POST to `/api/auth/login` endpoint
- Returns user data on success, 401 on invalid credentials
- Auto-login persistence with localStorage

### 3. Signup System ✅ (NEW!)
- New user registration form
- POST to `/api/users` endpoint
- Form validation (password match, length check)
- Duplicate email detection
- Success screen with auto-redirect to login

## How to View Database Users

Run this script to see all users in the database:
```powershell
.\view-users.ps1
```

Or use psql directly:
```powershell
psql -U postgres -d settlr_db
```
Then:
```sql
SELECT id, name, email, password, created_at FROM users;
```

## Testing the Complete Flow

### 1. Start Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### 2. Start Frontend
```powershell
cd frontend
npm start
```

### 3. Create Account (Signup Flow)
1. Open http://localhost:3000
2. Click "Sign up" link on login page
3. Fill in the form:
   - Name: Your Name
   - Email: your.email@example.com
   - Password: test123
   - Confirm Password: test123
4. Click "Sign up"
5. You'll see success message and auto-redirect to login

### 4. Login with New Account
1. Enter the email and password you just created
2. Click "Sign in"
3. You're logged in!

### 5. View User in Database
```powershell
.\view-users.ps1
```

## API Endpoints

### Authentication
- **POST** `/api/auth/login` - Login with email/password
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### User Management
- **GET** `/api/users` - Get all users
- **GET** `/api/users/{id}` - Get user by ID
- **GET** `/api/users/email/{email}` - Get user by email
- **POST** `/api/users` - Create new user (signup)
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **PUT** `/api/users/{id}` - Update user
- **DELETE** `/api/users/{id}` - Delete user

## Quick PowerShell Test Commands

### Create a user via API
```powershell
$body = @{ name='Bob'; email='bob@example.com'; password='bob123' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8080/api/users -Method POST -Body $body -ContentType 'application/json'
```

### Login via API
```powershell
$loginBody = @{ email='bob@example.com'; password='bob123' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json'
```

## Database Schema

### users table
| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| name | VARCHAR | User's full name |
| email | VARCHAR | User's email (unique) |
| password | VARCHAR | Password (plaintext - demo only!) |
| created_at | TIMESTAMP | Account creation time |

## Security Notice ⚠️

**This is a demo implementation with plaintext passwords!**

For production, you should:
- Hash passwords with bcrypt
- Use JWT or session tokens
- Add rate limiting
- Enable HTTPS
- Add CSRF protection
- Implement password reset flow

## Files Changed/Added

### Backend
- `backend/src/main/java/com/settlr/backend/entity/User.java` - Added password field
- `backend/src/main/java/com/settlr/backend/dto/UserDTO.java` - Added password field
- `backend/src/main/java/com/settlr/backend/dto/LoginRequest.java` - NEW login DTO
- `backend/src/main/java/com/settlr/backend/controller/AuthController.java` - NEW auth controller
- `backend/src/main/java/com/settlr/backend/service/UserService.java` - Added password handling
- `backend/src/main/resources/application.properties` - Updated DB password

### Frontend
- `frontend/src/components/Login.js` - Email/password form + signup link
- `frontend/src/components/Signup.js` - NEW signup component
- `frontend/src/App.js` - Added signup view routing

### Scripts
- `setup-postgres.ps1` - Automated PostgreSQL setup
- `view-users.ps1` - View database users
- `AUTH_SETUP.md` - This file!

## Troubleshooting

### Backend won't start - password authentication failed
Update `backend/src/main/resources/application.properties` line 9 with your PostgreSQL password.

### Cannot connect to backend
Make sure backend is running on port 8080:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### User already exists error
Email must be unique. Try a different email or check existing users:
```powershell
.\view-users.ps1
```
