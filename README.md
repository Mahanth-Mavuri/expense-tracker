# 💰 Expense Tracker

A full-stack personal finance management application that allows users to securely track income and expenses, analyze spending patterns, and manage recurring transactions.

🔗 **Live Demo:** https://YOUR-VERCEL-URL.vercel.app  
🔗 **GitHub:** https://github.com/Mahanth-Mavuri/expense-tracker

---

## 📌 Overview

Expense Tracker is a full-stack web application built to help users manage their personal finances in one place.

Users can create an account, log in securely, add income and expense transactions, edit or delete transactions, filter and search their financial records, view analytics through charts, and create recurring transactions.

The application uses a React frontend, Node.js/Express backend, and PostgreSQL database.

---

## ✨ Features

### 🔐 Authentication
- User registration
- User login
- Password hashing using bcrypt
- JWT-based authentication
- Protected user data
- Logout functionality

### 💸 Transaction Management
- Add income transactions
- Add expense transactions
- Edit transactions
- Delete transactions
- Transaction categories
- Transaction descriptions
- Transaction dates
- User-specific transactions

### 🔄 Recurring Transactions
- Create recurring income or expense rules
- Weekly recurring transactions
- Monthly recurring transactions
- Yearly recurring transactions
- Start and end dates
- Automatic generation of due recurring transactions

### 📊 Dashboard & Analytics
- Total income
- Total expenses
- Current balance
- Transaction history
- Expense/income charts
- Category-based analysis

### 🔎 Filtering & Search
- Search transactions
- Filter by transaction type
- Filter by category
- All-time transactions
- This month
- Last month
- Custom date range

### 📱 Responsive UI
- Desktop-friendly interface
- Mobile-responsive design
- Clean dashboard layout

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Axios
- React Router
- Recharts
- Lucide React
- CSS

### Backend
- Node.js
- Express.js
- JWT
- bcryptjs
- CORS
- dotenv

### Database
- PostgreSQL
- Neon PostgreSQL

### Deployment
- Vercel — Frontend
- Render — Backend
- Neon — Database

---

## 🏗️ Project Structure

```text
expense-tracker/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
