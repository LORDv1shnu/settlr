# Settlr 💰

**A Free and Open Source (FOSS) alternative to Splitwise**

Settlr is a modern, full-stack expense splitting application that helps you track shared expenses with friends, roommates, and groups. Built with a focus on simplicity, accuracy, and user experience, Settlr makes it easy to split bills, track balances, and settle up with your friends.
---

## 🌟 Why Settlr?

- **Free & Open Source**: No subscriptions, no premium tiers, just free forever
- **Privacy First**: Self-host your own instance and own your data
- **Indian Currency Native**: Built with ₹ (INR) as the default currency
- **Accurate Balance Tracking**: Mathematically correct balance calculations with proper settlement tracking
- **Modern UI/UX**: Clean, intuitive interface built with Tailwind CSS
- **Real-time Updates**: Instant balance recalculation across all pages

---

## 🚀 Features

### Core Features
- ✅ **Multi-User Support**: Create an account and manage your personal expenses
- ✅ **Group Management**: Create unlimited groups with multiple members
- ✅ **Expense Splitting**: Add expenses and split them equally among group members
- ✅ **Balance Tracking**: Real-time calculation of who owes whom
- ✅ **Settlement Recording**: Mark payments as settled and track settlement history
- ✅ **Dashboard Overview**: View all your balances and recent activity at a glance
- ✅ **Group Invitations**: Invite friends to join your expense groups via email
- ✅ **Member Management**: Add or remove members from groups

### Smart Balance Calculations
- **Automatic Balance Updates**: Balances update instantly when expenses or settlements are added
- **Settlement Tracking**: All settlements are recorded in the database
- **Accurate Accounting**: Proper double-entry bookkeeping ensures balances always add up to zero
- **Visual Indicators**: Color-coded balances (green for settled, blue for owed, red for owing)

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Real-time Validation**: Input validation and error handling
- **Loading States**: Clear feedback during data operations
- **Refresh Controls**: Manual refresh buttons for instant updates

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with Hooks and Functional Components
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, consistent icons
- **Context API** - State management for expenses and user data
- **Axios** - HTTP client for API calls

### Backend
- **Spring Boot 3.x** - Java framework for building REST APIs
- **Spring Data JPA** - Database abstraction layer
- **PostgreSQL 15** - Robust, production-ready relational database
- **Hibernate** - ORM for object-relational mapping
- **Maven** - Dependency management and build tool
- **Jakarta Validation** - Input validation and bean validation

### Architecture
- **RESTful API** - Clean, resource-based API design
- **MVC Pattern** - Separation of concerns in backend
- **Component-Based UI** - Reusable React components
- **Context + Hooks** - Modern React state management
- **CORS Enabled** - Secure cross-origin resource sharing

---

## 📋 Prerequisites

Before running Settlr, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Java 17 or higher** - [Download JDK](https://adoptium.net/)
- **PostgreSQL 15** - [Download](https://www.postgresql.org/download/)
- **Maven** (included via Maven Wrapper in project)

---

## 🏗️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/LORDv1shnu/settlr.git
cd settlr
```

### 2. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE settlr;
CREATE USER settlr_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE settlr TO settlr_user;
```

#### Update Database Configuration
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/settlr
spring.datasource.username=settlr_user
spring.datasource.password=your_secure_password
spring.jpa.hibernate.ddl-auto=update
```

### 3. Backend Setup

```bash
cd backend

# Build the project
./mvnw clean install

# Run the Spring Boot application
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

#### Windows Users
Use `mvnw.cmd` instead of `./mvnw`:
```powershell
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

---

## 🎯 Usage

### Getting Started

1. **Create an Account**
   - Navigate to `http://localhost:3000`
   - Register with your name and email

2. **Create a Group**
   - Click "Groups" in the navigation
   - Click "Create Group" and add a name
   - Invite friends via email or add them manually

3. **Add an Expense**
   - Select a group or click "Add Expense" from Dashboard
   - Enter expense details (description, amount, who paid)
   - The expense will be split equally among group members

4. **View Balances**
   - Dashboard shows your overall balances across all groups
   - Groups page shows per-group balances
   - Settle Up page shows who owes whom

5. **Settle Up**
   - Navigate to "Settle Up"
   - Mark payments as settled when friends pay you back
   - Balances update automatically

---

## 🔧 API Endpoints

### User Management
- `POST /api/users/register` - Register a new user
- `GET /api/users/{id}` - Get user details
- `GET /api/users/email/{email}` - Find user by email

### Group Management
- `POST /api/groups` - Create a new group
- `GET /api/groups/user/{userId}` - Get all groups for a user
- `GET /api/groups/{id}` - Get group details
- `POST /api/groups/{groupId}/members` - Add member to group
- `DELETE /api/groups/{groupId}/members/{userId}` - Remove member from group

### Expense Management
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/user/{userId}` - Get all expenses for a user
- `GET /api/expenses/group/{groupId}` - Get all expenses for a group
- `GET /api/expenses/group/{groupId}/balances` - Get balance summary for a group

### Settlement Management
- `POST /api/settlements` - Record a settlement
- `GET /api/settlements/group/{groupId}` - Get all settlements for a group
- `GET /api/settlements/user/{userId}` - Get all settlements for a user

### Invitations
- `POST /api/invitations/send` - Send a group invitation
- `GET /api/invitations/user/{userId}` - Get pending invitations
- `POST /api/invitations/{invitationId}/accept` - Accept an invitation
- `POST /api/invitations/{invitationId}/decline` - Decline an invitation

---

## 📊 Database Schema

### Core Tables
- **users** - User accounts and authentication
- **expense_groups** - Groups for organizing expenses
- **expenses** - Individual expense records
- **settlements** - Payment settlements between users
- **group_invitations** - Pending group invitations
- **group_members** - Many-to-many relationship between users and groups

### Key Relationships
- Users can belong to multiple groups
- Groups can have multiple expenses
- Expenses belong to one group and one payer
- Settlements record payments between users

---

## 🎨 UI Components

### Pages
- **Login/Register** - User authentication
- **Dashboard** - Overview of all balances and recent activity
- **Groups** - Manage expense groups and view member balances
- **Add Expense** - Create new expenses and split costs
- **Settle Up** - View and record settlements
- **Admin** - User management and system administration

### Key Features
- **Color-Coded Balances**
  - 🟢 Green: Settled (balance = 0)
  - 🔵 Blue: You're owed (positive balance)
  - 🔴 Red: You owe (negative balance)

- **Real-time Updates**
  - Automatic balance recalculation
  - Instant UI updates after actions
  - Manual refresh buttons for user control

---

## 🐛 Recent Bug Fixes & Improvements

### Balance Calculation Fixes (October 2025)
- ✅ **Fixed Settlement Arithmetic**: Corrected backend logic where settlements were being applied backwards
- ✅ **Fixed Expense Balance Calculation**: Resolved issue where expense payer's balance was doubled
- ✅ **Fixed Groups Page Display**: Corrected inverted display logic showing positive balances as "You Owe"
- ✅ **Fixed Member Balances Section**: Corrected member balance display in group details
- ✅ **Added Settlement Tracking**: Migrated from localStorage to PostgreSQL for persistent settlement records
- ✅ **Dashboard Settlement Integration**: Dashboard now properly fetches and applies settlements from database

### Technical Details
- **Sign Convention**: Positive (+) = you're owed money, Negative (-) = you owe money
- **Settlement Formula**: `fromUser += amount` (debt decreases), `toUser -= amount` (credit decreases)
- **Expense Formula**: `payer += (totalAmount - perPersonShare)`, `others -= perPersonShare`

## 🚀 Running the Software

### Development
```bash
# Backend
cd backend && ./mvn spring-boot:run

# Frontend
cd frontend && npm start
```

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? Please open an issue on GitHub:

- **Bug Report**: Include steps to reproduce, expected behavior, and actual behavior
- **Feature Request**: Describe the feature, use case, and potential implementation


## 🗺️ Roadmap

### Planned Features
- [ ] Multiple currency support
- [ ] Unequal expense splitting (custom percentages)
- [ ] Expense categories and tags
- [ ] Receipt image uploads
- [ ] Export data to CSV/PDF
- [ ] Email notifications for new expenses and settlements
- [ ] Mobile app (React Native)
- [ ] Group chat/comments
- [ ] Recurring expenses
- [ ] Statistics and analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme

### Technical Improvements
- [ ] Docker containerization
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Comprehensive test coverage (unit + integration)
- [ ] API documentation with Swagger/OpenAPI
- [ ] Performance optimization and caching
- [ ] WebSocket support for real-time updates
- [ ] Progressive Web App (PWA) features


## ⚡ Quick Start (TL;DR)

```bash
# 1. Clone and enter directory
git clone https://github.com/LORDv1shnu/settlr.git && cd settlr

# 2. Setup PostgreSQL database
createdb settlr
psql settlr -c "CREATE USER settlr_user WITH PASSWORD 'password';"
psql settlr -c "GRANT ALL PRIVILEGES ON DATABASE settlr TO settlr_user;"

# 3. Start backend (in one terminal)
cd backend && ./mvnw spring-boot:run

# 4. Start frontend (in another terminal)
cd frontend && npm install && npm start

# 5. Open http://localhost:3000 🎉
```

---

**Made with ❤️ for Java Expo CCE 25**