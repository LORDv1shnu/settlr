# Settlr

> A free and open-source expense splitting application - A FOSS alternative to Splitwise

Settlr is a modern, full-stack web application designed to help friends, roommates, and groups track shared expenses and settle debts easily. Built with a focus on simplicity and transparency, Settlr provides all the essential features you need to manage group expenses without the premium paywalls.

## 🌟 Features

### Expense Management
- **Create and Track Expenses**: Record expenses with detailed descriptions, amounts, and specify who paid
- **Smart Expense Splitting**: Automatically split expenses equally among group members or customize the split
- **Group Organization**: Create multiple groups for different contexts (trips, roommates, events, etc.)
- **Recent Activity Dashboard**: View your recent expenses and activity at a glance

### Balance Tracking
- **Real-time Balance Calculation**: Automatically calculate who owes whom and how much
- **Group-level Balances**: Track balances separately for each group
- **Personal Balance Overview**: See your total owed and receivable amounts across all groups
- **Visual Balance Indicators**: Clear color-coded indicators for debts and credits

### Settlement Management
- **Optimal Settlement Calculation**: Algorithm to minimize the number of transactions needed to settle all debts
- **Settle Up Interface**: Dedicated interface to review and settle balances with friends
- **Settlement Suggestions**: Get smart suggestions on who should pay whom to settle group debts efficiently

### User Experience
- **User Management**: Create and manage multiple user accounts
- **Intuitive Navigation**: Clean, modern interface built with React and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Quick Login**: Simple user selection for quick access

## 🛠️ Tech Stack

### Backend
- **Java 21**: Modern Java runtime with latest language features
- **Spring Boot 3.5.6**: Enterprise-grade Java framework for building robust REST APIs
- **Spring Data JPA**: Simplified data access layer with JPA/Hibernate
- **Maven**: Dependency management and build automation
- **H2 Database**: In-memory database for development and testing
- **PostgreSQL**: Production-ready relational database
- **Bean Validation**: Server-side input validation

### Frontend
- **React 18.2**: Modern JavaScript library for building user interfaces
- **React Router v6**: Client-side routing and navigation
- **Tailwind CSS 3.2**: Utility-first CSS framework for rapid UI development
- **Axios**: Promise-based HTTP client for API requests
- **Lucide React**: Beautiful, consistent icon library
- **date-fns**: Modern JavaScript date utility library

### Architecture
- **RESTful API**: Clean, resource-oriented API design
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **DTO Pattern**: Data Transfer Objects for clean API contracts
- **Repository Pattern**: Abstracted data access layer
- **Service Layer**: Business logic separation from controllers

## 🚀 Running the Software

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the application using Maven wrapper:**
   ```bash
   mvn spring-boot:run
   ```

3. **The backend server will start on:** `http://localhost:8080`

4. **Access H2 Console (Development):** `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:settlr_dev`
   - Username: `sa`
   - Password: (leave blank)

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **The application will open in your browser at:** `http://localhost:3000`

## 🎯 Usage Guide

### Getting Started with Settlr

1. **Create or Select User Account**
   - On first launch, you'll see a login screen
   - Select an existing user or create a new account with your name and email

2. **Create a Group**
   - Navigate to the "Groups" section
   - Click "Create New Group"
   - Enter a group name and optional description
   - Add members to the group

3. **Add Expenses**
   - Go to "Add Expense" or click the "+" button from the dashboard
   - Select the group for the expense
   - Enter the expense description and amount
   - Choose who paid for the expense
   - Select who should split the expense (defaults to all group members)

4. **View Dashboard**
   - See your overall balance across all groups
   - View recent expenses and activity
   - Quick access to add new expenses

5. **Check Balances**
   - Visit the "Settle Up" section
   - See detailed breakdowns of who owes whom
   - Get optimal settlement suggestions to minimize transactions

6. **Settle Debts**
   - Follow the settlement suggestions
   - Make payments outside the app
   - Keep track of settled amounts

## 🔧 Configuration

### Backend Configuration

The application uses Spring profiles for different environments:

**Development (default):**
- Uses H2 in-memory database
- Database is reset on each restart
- SQL logging enabled
- H2 console available at `/h2-console`

**Production:**
- Uses PostgreSQL database
- Configure via environment variables:
  ```bash
  DATABASE_URL=jdbc:postgresql://localhost:5432/settlr_prod
  DATABASE_USERNAME=postgres
  DATABASE_PASSWORD=your_password
  ```

To run in production mode:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

### Frontend Configuration

The frontend is configured to connect to the backend at `http://localhost:8080`. If you need to change this, update the API base URL in the components.

## 🧪 API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/{id}` - Get group by ID
- `GET /api/groups/user/{userId}` - Get groups for a user
- `POST /api/groups` - Create new group
- `PUT /api/groups/{id}` - Update group
- `DELETE /api/groups/{id}` - Delete group
- `POST /api/groups/{groupId}/members/{userId}` - Add member to group
- `DELETE /api/groups/{groupId}/members/{userId}` - Remove member from group

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/{id}` - Get expense by ID
- `GET /api/expenses/group/{groupId}` - Get expenses for a group
- `GET /api/expenses/user/{userId}` - Get expenses for a user
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `GET /api/expenses/group/{groupId}/total` - Get total expenses for a group

## 🤝 Contributing

Contributions are welcome! This is a FOSS project and we encourage community involvement.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Commit your changes:** `git commit -m 'Add some feature'`
4. **Push to the branch:** `git push origin feature/your-feature-name`
5. **Submit a pull request**

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🐛 Bug Reports & Feature Requests

If you encounter any bugs or have feature requests, please create an issue on GitHub with:
- A clear description of the issue/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## 🎯 Roadmap

Future enhancements planned for Settlr:

- [ ] User authentication and authorization
- [ ] Email notifications for expenses and settlements
- [ ] Export expense reports (CSV, PDF)
- [ ] Expense categories and tags
- [ ] Recurring expenses
- [ ] Multi-currency support
- [ ] Receipt image upload
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Advanced splitting options (percentage-based, custom amounts)
- [ ] Payment integration (optional)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).