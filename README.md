# 💰 Settlr - Split Expenses Made Simple

<div align="center">

![Settlr Logo](https://img.shields.io/badge/Settlr-Split%20Expenses-blue?style=for-the-badge&logo=dollar-sign)

A modern, full-stack expense splitting application built with **Spring Boot** and **React**. Split bills, track group expenses, and settle debts with friends and family effortlessly.

[![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=java)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-brightgreen?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

</div>

## ✨ Features

- 🎯 **Smart Expense Splitting** - Automatically calculate who owes what
- 👥 **Group Management** - Create and manage expense groups
- 📱 **Mobile-First Design** - Responsive PWA with offline support
- 🔐 **Secure Authentication** - User registration and login system
- 💸 **Settlement Tracking** - Track payments and settle debts
- 🔔 **Real-Time Notifications** - Group invitations and updates
- 📊 **Expense Analytics** - View spending patterns and balances
- 🌙 **Modern UI/UX** - Clean, intuitive interface with dark mode support

## 🚀 Quick Start

### Prerequisites

- **Java 21** or higher
- **Node.js 18** or higher
- **PostgreSQL** database
- **Maven 3.6+**

### 1. Clone the Repository

```bash
git clone https://github.com/LORDv1shnu/settlr.git
cd settlr
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE settlr_db;

-- Create user (optional)
CREATE USER settlr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE settlr_db TO settlr_user;
```

### 3. Backend Setup

```bash
cd backend

# Configure database in src/main/resources/application.properties
# Update the database URL, username, and password

# Install dependencies and run
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

## 🏗️ Project Structure

```
settlr/
├── backend/                 # Spring Boot API
│   ├── src/main/java/
│   │   └── com/settlr/backend/
│   │       ├── controller/  # REST controllers
│   │       ├── service/     # Business logic
│   │       ├── repository/  # Data access layer
│   │       ├── entity/      # JPA entities
│   │       └── dto/         # Data transfer objects
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Context providers
│   │   └── App.js          # Main application
│   └── public/
│       ├── manifest.json    # PWA manifest
│       └── sw.js           # Service worker
│
└── README.md
```

## 🔧 Configuration

### Backend Configuration

Update `backend/src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/settlr_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Server Configuration
server.port=8080
```

### Frontend Configuration

The frontend automatically connects to the backend at `http://localhost:8080`. For production, update the API base URL in the components.

## 📱 PWA Features

Settlr is a Progressive Web App (PWA) that offers:

- **Installable** - Add to home screen on mobile devices
- **Offline Support** - Basic caching for offline functionality
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Push Notifications** - Real-time updates (coming soon)

## 🎮 Usage Guide

### Creating Your First Group

1. **Sign Up/Login** - Create an account or log in
2. **Create Group** - Click "Groups" → "Create New Group"
3. **Add Members** - Search and invite friends by email
4. **Add Expenses** - Start adding shared expenses

### Adding Expenses

1. Navigate to "Add Expense"
2. Enter expense details (description, amount)
3. Select who paid and how to split
4. Save - balances update automatically

### Settling Up

1. Go to "Settle Up" section
2. View who owes what to whom
3. Record payments when debts are settled
4. Balances update in real-time

## 🛠️ Development

### Running Tests

**Backend:**
```bash
cd backend
mvn test
```

**Frontend:**
```bash
cd frontend
npm test
```

### Building for Production

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder with your preferred static server
```

## 🔐 Security

- Password-based authentication
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection protection via JPA

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Initial Frontend by [Rohan](https://github.com/rohanks-hub)
- Frontend Polish by [Siddhanth](https://github.com/siddhanth-dev)
- Improved Features and Login System by [Sreeram](https://github.com/WanderingHumanid)
- CodeScape Project Expo (Semester 3) by Christ College of Engineering, Irinjalakuda

---

<div align="center">

**Built with ❤️ by [LORDv1shnu](https://github.com/LORDv1shnu) and Team**

[⭐ Star this repo](https://github.com/LORDv1shnu/settlr) if you find it helpful!

</div>
