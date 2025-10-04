# Settler - Splitwise Clone

A modern React application for splitting expenses among friends, inspired by Splitwise. Built with React, React Router, and Tailwind CSS. Perfect for Indian users with ₹ currency and local examples.

## Features

- **Dashboard**: Overview of your balances, recent expenses, and who owes what
- **Add Expenses**: Create new expenses and split them among group members
- **Groups**: Manage different groups of friends for organizing expenses
- **Settle Up**: Track and mark balances as settled
- **Real-time Balance Calculation**: Automatically calculates who owes whom
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Screenshots

The app includes:
- Clean, modern UI with intuitive navigation
- Color-coded groups and balances
- Easy expense splitting with visual feedback
- Comprehensive balance tracking

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Settler
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.js     # Main dashboard view
│   ├── AddExpense.js    # Add new expense form
│   ├── Groups.js        # Manage groups
│   ├── SettleUp.js      # Settle balances
│   └── Navigation.js    # App navigation
├── context/             # React Context for state management
│   └── ExpenseContext.js
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles with Tailwind
```

## Key Features Explained

### Expense Splitting
- Add expenses with description, amount, and group
- Choose who paid and who should split the cost
- Automatic balance calculation between all members

### Group Management
- Create multiple groups (e.g., "College Friends", "Mumbai Trip", "Office Lunch")
- Add/remove members from groups
- Color-coded groups for easy identification

### Balance Tracking
- Real-time calculation of who owes whom
- Net balance showing if you're owed money or owe money
- Simplified view of all outstanding balances

### Settlement System
- Mark individual balances as settled
- Visual feedback for completed settlements
- Track settlement history

## Technologies Used

- **React 18** - Frontend framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **date-fns** - Date manipulation
- **React Context API** - State management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] User authentication and profiles
- [ ] Data persistence with backend API
- [ ] Push notifications for new expenses
- [ ] Receipt photo uploads
- [ ] Export expense reports
- [ ] Multi-currency support
- [ ] Recurring expenses
- [ ] Expense categories and tags

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Splitwise
- Icons by Lucide
- UI components styled with Tailwind CSS
