import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Pencil,
  Trash2,
  Search,
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogOut,
  CalendarDays,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const API_URL = "https://expense-tracker-backend-xl82.onrender.com/api";

const emptyForm = {
  title: "",
  amount: "",
  category: "Food",
  type: "expense",
  date: new Date().toISOString().split("T")[0],
};

const emptyRecurringForm = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  frequency: "monthly",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
};

function App() {
  // =========================
  // AUTH
  // =========================

  const [token, setToken] = useState(
    localStorage.getItem("expense_token")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("expense_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // =========================
  // TRANSACTIONS
  // =========================

  const [transactions, setTransactions] = useState([]);

  // =========================
  // RECURRING TRANSACTIONS
  // =========================

  const [recurringTransactions, setRecurringTransactions] =
    useState([]);

  const [showRecurringForm, setShowRecurringForm] =
    useState(false);

  const [recurringForm, setRecurringForm] = useState(
    emptyRecurringForm
  );

  const [editingRecurringId, setEditingRecurringId] =
    useState(null);

  // =========================
  // NORMAL TRANSACTION FORM
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  // =========================
  // FILTERS
  // =========================

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  const [customStartDate, setCustomStartDate] =
    useState("");

  const [customEndDate, setCustomEndDate] =
    useState("");

  // =========================
  // AXIOS AUTH
  // =========================

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("expense_token");
    localStorage.removeItem("expense_user");

    setToken(null);
    setUser(null);
    setTransactions([]);
    setRecurringTransactions([]);

    setAuthForm({
      name: "",
      email: "",
      password: "",
    });

    setAuthMode("login");
  };

  // =========================
  // FETCH USER
  // =========================

  const fetchCurrentUser = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/auth/me`,
        authHeaders
      );

      setUser(response.data);

      localStorage.setItem(
        "expense_user",
        JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("Fetch user error:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
      }
    }
  };

  // =========================
  // FETCH TRANSACTIONS
  // =========================

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/transactions`,
        authHeaders
      );

      const formatted = response.data.map(
        (transaction) => ({
          id: transaction.id,

          title:
            transaction.description ||
            transaction.category,

          amount: Number(transaction.amount),

          category: transaction.category,

          type: transaction.type,

          date: transaction.transaction_date,
        })
      );

      setTransactions(formatted);
    } catch (error) {
      console.error(
        "Fetch transactions error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
      }
    }
  };

  // =========================
  // FETCH RECURRING TRANSACTIONS
  // =========================

  const fetchRecurringTransactions = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/recurring-transactions`,
        authHeaders
      );

      setRecurringTransactions(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch recurring transactions:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
      }
    }
  };

  // =========================
  // INITIAL DATA LOAD
  // =========================

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchTransactions();
      fetchRecurringTransactions();
    }
  }, [token]);

  // =========================
  // AUTH FORM
  // =========================

  const handleAuthChange = (event) => {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value,
    });

    setAuthError("");
  };

  // =========================
  // LOGIN / SIGNUP
  // =========================

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login"
          ? "/auth/login"
          : "/auth/signup";

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            };

      const response = await axios.post(
        `${API_URL}${endpoint}`,
        body
      );

      const receivedToken = response.data.token;
      const receivedUser = response.data.user;

      localStorage.setItem(
        "expense_token",
        receivedToken
      );

      localStorage.setItem(
        "expense_user",
        JSON.stringify(receivedUser)
      );

      setToken(receivedToken);
      setUser(receivedUser);

      setAuthForm({
        name: "",
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("Authentication error:", error);

      setAuthError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // =========================
  // NORMAL TRANSACTION FORM
  // =========================

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (transaction) => {
    setEditingId(transaction.id);

    setFormData({
      title: transaction.title,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
      date: transaction.date,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // =========================
  // ADD / UPDATE TRANSACTION
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.amount ||
      Number(formData.amount) <= 0
    ) {
      alert("Please enter a valid name and amount.");
      return;
    }

    try {
      const data = {
        type: formData.type,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.title,
        transaction_date: formData.date,
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/transactions/${editingId}`,
          data,
          authHeaders
        );
      } else {
        await axios.post(
          `${API_URL}/transactions`,
          data,
          authHeaders
        );
      }

      await fetchTransactions();

      closeForm();
    } catch (error) {
      console.error(
        "Save transaction error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      alert(
        error.response?.data?.message ||
          "Failed to save transaction."
      );
    }
  };

  // =========================
  // DELETE TRANSACTION
  // =========================

  const deleteTransaction = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_URL}/transactions/${id}`,
        authHeaders
      );

      await fetchTransactions();
    } catch (error) {
      console.error(
        "Delete transaction error:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      alert(
        error.response?.data?.message ||
          "Failed to delete transaction."
      );
    }
  };

  // =========================================================
  // RECURRING TRANSACTION FORM
  // =========================================================

  const handleRecurringChange = (event) => {
    setRecurringForm({
      ...recurringForm,
      [event.target.name]: event.target.value,
    });
  };

  const openAddRecurringForm = () => {
    setEditingRecurringId(null);

    setRecurringForm({
      type: "expense",
      amount: "",
      category: "Food",
      description: "",
      frequency: "monthly",
      start_date: new Date()
        .toISOString()
        .split("T")[0],
      end_date: "",
    });

    setShowRecurringForm(true);
  };

  const handleRecurringSubmit = async (event) => {
    event.preventDefault();

    if (
      !recurringForm.amount ||
      Number(recurringForm.amount) <= 0 ||
      !recurringForm.category ||
      !recurringForm.frequency ||
      !recurringForm.start_date
    ) {
      alert(
        "Please enter all required recurring transaction details."
      );

      return;
    }

    if (
      recurringForm.end_date &&
      recurringForm.end_date <
        recurringForm.start_date
    ) {
      alert(
        "End date cannot be before the start date."
      );

      return;
    }

    try {
      const data = {
        type: recurringForm.type,

        amount: Number(
          recurringForm.amount
        ),

        category: recurringForm.category,

        description:
          recurringForm.description.trim(),

        frequency: recurringForm.frequency,

        start_date:
          recurringForm.start_date,

        end_date:
          recurringForm.end_date || null,
      };

      if (editingRecurringId) {
        await axios.put(
          `${API_URL}/recurring-transactions/${editingRecurringId}`,
          data,
          authHeaders
        );
      } else {
        await axios.post(
          `${API_URL}/recurring-transactions`,
          data,
          authHeaders
        );
      }

      await fetchRecurringTransactions();

      setRecurringForm({
        type: "expense",
        amount: "",
        category: "Food",
        description: "",
        frequency: "monthly",
        start_date: new Date()
          .toISOString()
          .split("T")[0],
        end_date: "",
      });

      setEditingRecurringId(null);

      setShowRecurringForm(false);
    } catch (error) {
      console.error(
        "Failed to save recurring transaction:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      alert(
        error.response?.data?.message ||
          "Failed to save recurring transaction."
      );
    }
  };

  // =========================
  // EDIT RECURRING TRANSACTION
  // =========================

  const handleEditRecurring = (
    transaction
  ) => {
    setRecurringForm({
      type: transaction.type,

      amount: transaction.amount,

      category: transaction.category,

      description:
        transaction.description || "",

      frequency: transaction.frequency,

      start_date: transaction.start_date
        ? transaction.start_date.slice(0, 10)
        : "",

      end_date: transaction.end_date
        ? transaction.end_date.slice(0, 10)
        : "",
    });

    setEditingRecurringId(transaction.id);

    setShowRecurringForm(true);
  };

  // =========================
  // DELETE RECURRING
  // =========================

  const handleDeleteRecurring = async (
    id
  ) => {
    const confirmed = window.confirm(
      "Delete this recurring transaction?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_URL}/recurring-transactions/${id}`,
        authHeaders
      );

      await fetchRecurringTransactions();
    } catch (error) {
      console.error(
        "Failed to delete recurring transaction:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      alert(
        error.response?.data?.message ||
          "Failed to delete recurring transaction."
      );
    }
  };

  // =========================
  // CLOSE RECURRING FORM
  // =========================

  const closeRecurringForm = () => {
    setShowRecurringForm(false);

    setEditingRecurringId(null);

    setRecurringForm({
      type: "expense",
      amount: "",
      category: "Food",
      description: "",
      frequency: "monthly",
      start_date: new Date()
        .toISOString()
        .split("T")[0],
      end_date: "",
    });
  };

  // =========================
  // DATE FILTER
  // =========================

  const filteredByDate = useMemo(() => {
    const today = new Date();

    return transactions.filter(
      (transaction) => {
        const transactionDate = new Date(
          transaction.date
        );

        if (dateFilter === "all") {
          return true;
        }

        if (dateFilter === "thisMonth") {
          return (
            transactionDate.getMonth() ===
              today.getMonth() &&
            transactionDate.getFullYear() ===
              today.getFullYear()
          );
        }

        if (dateFilter === "lastMonth") {
          const lastMonth = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
          );

          return (
            transactionDate.getMonth() ===
              lastMonth.getMonth() &&
            transactionDate.getFullYear() ===
              lastMonth.getFullYear()
          );
        }

        if (dateFilter === "custom") {
          if (customStartDate) {
            const start = new Date(
              `${customStartDate}T00:00:00`
            );

            if (transactionDate < start) {
              return false;
            }
          }

          if (customEndDate) {
            const end = new Date(
              `${customEndDate}T23:59:59`
            );

            if (transactionDate > end) {
              return false;
            }
          }

          return true;
        }

        return true;
      }
    );
  }, [
    transactions,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // =========================
  // SEARCH + TYPE + CATEGORY
  // =========================

  const filteredTransactions =
    filteredByDate.filter(
      (transaction) => {
        const matchesSearch =
          transaction.title
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesType =
          typeFilter === "all" ||
          transaction.type === typeFilter;

        const matchesCategory =
          categoryFilter === "all" ||
          transaction.category ===
            categoryFilter;

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory
        );
      }
    );

  // =========================
  // TOTAL INCOME
  // =========================

  const income = useMemo(
    () =>
      filteredByDate
        .filter(
          (item) =>
            item.type === "income"
        )
        .reduce(
          (total, item) =>
            total + item.amount,
          0
        ),
    [filteredByDate]
  );

  // =========================
  // TOTAL EXPENSES
  // =========================

  const expenses = useMemo(
    () =>
      filteredByDate
        .filter(
          (item) =>
            item.type === "expense"
        )
        .reduce(
          (total, item) =>
            total + item.amount,
          0
        ),
    [filteredByDate]
  );

  // =========================
  // BALANCE
  // =========================

  const balance = income - expenses;

  // =========================
  // INCOME / EXPENSE CHART
  // =========================

  const incomeExpenseData = [
    {
      name: "Money",
      Income: income,
      Expenses: expenses,
    },
  ];

  // =========================
  // CATEGORY CHART
  // =========================

  const categoryData = useMemo(() => {
    const totals = {};

    filteredByDate
      .filter(
        (item) =>
          item.type === "expense"
      )
      .forEach((item) => {
        if (!totals[item.category]) {
          totals[item.category] = 0;
        }

        totals[item.category] +=
          item.amount;
      });

    return Object.entries(totals).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [filteredByDate]);

  // =========================
  // MONTHLY CHART
  // =========================

  const monthlyData = useMemo(() => {
    const totals = {};

    filteredByDate
      .filter(
        (item) =>
          item.type === "expense"
      )
      .forEach((item) => {
        const month =
          new Date(
            item.date
          ).toLocaleDateString(
            "en-IN",
            {
              month: "short",
              year: "numeric",
            }
          );

        if (!totals[month]) {
          totals[month] = 0;
        }

        totals[month] +=
          item.amount;
      });

    return Object.entries(totals).map(
      ([month, amount]) => ({
        month,
        amount,
      })
    );
  }, [filteredByDate]);

  // =========================
  // FORMATTERS
  // =========================

  const formatAmount = (amount) =>
    Number(amount).toLocaleString(
      "en-IN"
    );

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  const expensePercentage =
    income > 0
      ? Math.min(
          (expenses / income) * 100,
          100
        )
      : 0;

  // =========================================================
  // AUTH SCREEN
  // =========================================================

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-logo">
            <div className="logo-icon">
              <Wallet size={24} />
            </div>

            <span>
              ExpenseTracker
            </span>
          </div>

          <h1>
            {authMode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p className="auth-subtitle">
            {authMode === "login"
              ? "Login to manage your finances."
              : "Start tracking your money today."}
          </p>

          {authError && (
            <div className="auth-error">
              {authError}
            </div>
          )}

          <form
            onSubmit={
              handleAuthSubmit
            }
          >
            {authMode ===
              "signup" && (
              <>
                <label>
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={
                    authForm.name
                  }
                  onChange={
                    handleAuthChange
                  }
                  required
                />
              </>
            )}

            <label>
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={
                authForm.email
              }
              onChange={
                handleAuthChange
              }
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={
                authForm.password
              }
              onChange={
                handleAuthChange
              }
              required
              minLength={6}
            />

            <button
              className="submit-button"
              type="submit"
              disabled={
                authLoading
              }
            >
              {authLoading
                ? "Please wait..."
                : authMode ===
                  "login"
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {authMode ===
            "login" ? (
              <>
                Don't have an
                account?{" "}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      "signup"
                    );
                    setAuthError(
                      ""
                    );
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an
                account?{" "}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      "login"
                    );
                    setAuthError(
                      ""
                    );
                  }}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            <Wallet size={22} />
          </div>

          <span>
            ExpenseTracker
          </span>
        </div>

        <nav className="navigation">

          <button className="nav-item active">
            <LayoutDashboard
              size={20}
            />

            Dashboard
          </button>

          <button className="nav-item">
            <Receipt size={20} />

            Transactions
          </button>

          <button className="nav-item">
            <BarChart3
              size={20}
            />

            Analytics
          </button>

        </nav>

        <div className="sidebar-bottom">

          <p>
            {user?.name ||
              "User"}
          </p>

          <small>
            {user?.email ||
              "Personal Finance"}
          </small>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <div className="main-content">

        {/* HEADER */}

        <header className="header">

          <div>
            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              {user?.name ||
                "User"}.
            </p>
          </div>

          <button
            className="add-button"
            onClick={
              openAddForm
            }
          >
            <Plus size={20} />

            Add Transaction
          </button>

        </header>

        <main className="dashboard">

          {/* =================================================
              DATE FILTER
          ================================================= */}

          <section className="date-filter-card">

            <div className="date-filter-title">

              <CalendarDays
                size={20}
              />

              <div>

                <h3>
                  Date Range
                </h3>

                <p>
                  Filter your dashboard
                  by time period.
                </p>

              </div>

            </div>

            <div className="date-filter-controls">

              <select
                value={
                  dateFilter
                }
                onChange={(
                  event
                ) =>
                  setDateFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  All Time
                </option>

                <option value="thisMonth">
                  This Month
                </option>

                <option value="lastMonth">
                  Last Month
                </option>

                <option value="custom">
                  Custom Range
                </option>
              </select>

              {dateFilter ===
                "custom" && (
                <>
                  <input
                    type="date"
                    value={
                      customStartDate
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomStartDate(
                        event.target
                          .value
                      )
                    }
                  />

                  <span>
                    to
                  </span>

                  <input
                    type="date"
                    value={
                      customEndDate
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomEndDate(
                        event.target
                          .value
                      )
                    }
                  />
                </>
              )}

            </div>

          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="summary-grid">

            <div className="summary-card">

              <div className="summary-top">

                <div className="card-icon">
                  <Wallet
                    size={22}
                  />
                </div>

              </div>

              <p>
                Total Balance
              </p>

              <h2>
                ₹
                {formatAmount(
                  balance
                )}
              </h2>

            </div>

            <div className="summary-card">

              <div className="summary-top">

                <div className="card-icon income-icon">
                  <TrendingUp
                    size={22}
                  />
                </div>

              </div>

              <p>
                Total Income
              </p>

              <h2>
                ₹
                {formatAmount(
                  income
                )}
              </h2>

            </div>

            <div className="summary-card">

              <div className="summary-top">

                <div className="card-icon expense-icon">
                  <TrendingDown
                    size={22}
                  />
                </div>

              </div>

              <p>
                Total Expenses
              </p>

              <h2>
                ₹
                {formatAmount(
                  expenses
                )}
              </h2>

            </div>

          </section>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <section className="analytics-grid">

            <div className="analytics-card">

              <div className="section-title">

                <div>

                  <h2>
                    Monthly Overview
                  </h2>

                  <p>
                    Income vs expenses
                  </p>

                </div>

              </div>

              <div className="overview-content">

                <div className="overview-item">

                  <div className="overview-label">

                    <span className="dot income-dot"></span>

                    Income

                  </div>

                  <strong>
                    ₹
                    {formatAmount(
                      income
                    )}
                  </strong>

                </div>

                <div className="progress-container">

                  <div
                    className="progress-bar"
                    style={{
                      width: `${expensePercentage}%`,
                    }}
                  ></div>

                </div>

                <div className="overview-item">

                  <div className="overview-label">

                    <span className="dot expense-dot"></span>

                    Expenses

                  </div>

                  <strong>
                    ₹
                    {formatAmount(
                      expenses
                    )}
                  </strong>

                </div>

              </div>

            </div>

            <div className="analytics-card">

              <div className="section-title">

                <div>

                  <h2>
                    Savings
                  </h2>

                  <p>
                    Current balance
                  </p>

                </div>

              </div>

              <div className="savings-number">
                ₹
                {formatAmount(
                  balance
                )}
              </div>

              <p className="savings-text">
                {balance >= 0
                  ? "You're spending less than you earn."
                  : "Your expenses are higher than your income."}
              </p>

            </div>

          </section>

          {/* =================================================
              CHARTS
          ================================================= */}

          <section className="charts-section">

            <div className="section-header">

              <div>

                <h2>
                  Analytics
                </h2>

                <p>
                  Understand your
                  spending habits.
                </p>

              </div>

            </div>

            <div className="charts-grid">

              {/* INCOME VS EXPENSES */}

              <div className="chart-card">

                <div className="chart-header">

                  <h3>
                    Income vs Expenses
                  </h3>

                  <p>
                    Overall financial
                    comparison
                  </p>

                </div>

                <div className="chart-container">

                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >

                    <BarChart
                      data={
                        incomeExpenseData
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="name"
                      />

                      <YAxis />

                      <Tooltip
                        formatter={(
                          value
                        ) =>
                          `₹${formatAmount(
                            value
                          )}`
                        }
                      />

                      <Bar
                        dataKey="Income"
                        fill="#16a34a"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                      />

                      <Bar
                        dataKey="Expenses"
                        fill="#dc2626"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </div>

              {/* CATEGORY PIE */}

              <div className="chart-card">

                <div className="chart-header">

                  <h3>
                    Expenses by Category
                  </h3>

                  <p>
                    Where your money
                    goes
                  </p>

                </div>

                <div className="chart-container">

                  {categoryData.length ===
                  0 ? (
                    <div className="chart-empty">
                      No expense data
                      available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >

                      <PieChart>

                        <Pie
                          data={
                            categoryData
                          }
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={
                            95
                          }
                          label
                        >

                          {categoryData.map(
                            (
                              entry,
                              index
                            ) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={[
                                  "#2563eb",
                                  "#16a34a",
                                  "#dc2626",
                                  "#9333ea",
                                  "#ea580c",
                                  "#0891b2",
                                  "#64748b",
                                ][
                                  index %
                                    7
                                ]}
                              />
                            )
                          )}

                        </Pie>

                        <Tooltip
                          formatter={(
                            value
                          ) =>
                            `₹${formatAmount(
                              value
                            )}`
                          }
                        />

                      </PieChart>

                    </ResponsiveContainer>
                  )}

                </div>

              </div>

              {/* MONTHLY SPENDING */}

              <div className="chart-card chart-full">

                <div className="chart-header">

                  <h3>
                    Monthly Spending
                  </h3>

                  <p>
                    Expense trend over
                    time
                  </p>

                </div>

                <div className="chart-container">

                  {monthlyData.length ===
                  0 ? (
                    <div className="chart-empty">
                      No monthly expense
                      data available.
                    </div>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height={280}
                    >

                      <LineChart
                        data={
                          monthlyData
                        }
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="month"
                        />

                        <YAxis />

                        <Tooltip
                          formatter={(
                            value
                          ) =>
                            `₹${formatAmount(
                              value
                            )}`
                          }
                        />

                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{
                            r: 5,
                          }}
                        />

                      </LineChart>

                    </ResponsiveContainer>
                  )}

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              RECURRING TRANSACTIONS
          ================================================= */}

          <section className="transactions-section recurring-section">

            <div className="section-header">

              <div>

                <h2>
                  Recurring Transactions
                </h2>

                <p>
                  {
                    recurringTransactions.length
                  }{" "}
                  recurring transaction
                  {recurringTransactions.length !==
                  1
                    ? "s"
                    : ""}
                </p>

              </div>

              <button
                className="view-button"
                onClick={
                  openAddRecurringForm
                }
              >
                <Plus size={17} />

                Add Recurring
              </button>

            </div>

            <div className="transactions-list">

              {recurringTransactions.length ===
              0 ? (
                <div className="empty-state">

                  <CalendarDays
                    size={40}
                  />

                  <h3>
                    No recurring
                    transactions
                  </h3>

                  <p>
                    Add recurring income
                    or expenses such as
                    rent, salary,
                    subscriptions, or
                    bills.
                  </p>

                  <button
                    className="view-button"
                    onClick={
                      openAddRecurringForm
                    }
                  >
                    <Plus size={17} />

                    Add Recurring
                    Transaction
                  </button>

                </div>
              ) : (
                recurringTransactions.map(
                  (transaction) => (
                    <div
                      className="transaction"
                      key={
                        transaction.id
                      }
                    >

                      <div className="transaction-left">

                        <div
                          className={`transaction-icon ${
                            transaction.type ===
                            "income"
                              ? "transaction-income"
                              : "transaction-expense"
                          }`}
                        >
                          {transaction.type ===
                          "income" ? (
                            <ArrowUpRight
                              size={20}
                            />
                          ) : (
                            <ArrowDownRight
                              size={20}
                            />
                          )}
                        </div>

                        <div className="transaction-info">

                          <h3>
                            {transaction.description ||
                              transaction.category}
                          </h3>

                          <div className="transaction-meta">

                            <span>
                              {
                                transaction.category
                              }
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {transaction.frequency
                                .charAt(
                                  0
                                )
                                .toUpperCase() +
                                transaction.frequency.slice(
                                  1
                                )}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              From{" "}
                              {formatDate(
                                transaction.start_date
                              )}
                            </span>

                            {transaction.end_date && (
                              <>
                                <span>
                                  •
                                </span>

                                <span>
                                  Until{" "}
                                  {formatDate(
                                    transaction.end_date
                                  )}
                                </span>
                              </>
                            )}

                          </div>

                        </div>

                      </div>

                      <div className="transaction-right">

                        <strong
                          className={
                            transaction.type ===
                            "income"
                              ? "income"
                              : "expense"
                          }
                        >
                          {transaction.type ===
                          "income"
                            ? "+"
                            : "-"}
                          ₹
                          {formatAmount(
                            transaction.amount
                          )}
                        </strong>

                        <div className="transaction-actions">

                          <button
                            onClick={() =>
                              handleEditRecurring(
                                transaction
                              )
                            }
                            title="Edit recurring transaction"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteRecurring(
                                transaction.id
                              )
                            }
                            title="Delete recurring transaction"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </section>

          {/* =================================================
              NORMAL TRANSACTIONS
          ================================================= */}

          <section className="transactions-section">

            <div className="section-header">

              <div>

                <h2>
                  Transactions
                </h2>

                <p>
                  {
                    filteredTransactions.length
                  }{" "}
                  transaction
                  {filteredTransactions.length !==
                  1
                    ? "s"
                    : ""}
                </p>

              </div>

              <button
                className="view-button"
                onClick={
                  openAddForm
                }
              >
                <Plus size={17} />

                Add
              </button>

            </div>

            {/* FILTERS */}

            <div className="filters">

              <div className="search-box">

                <Search
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                />

              </div>

              <select
                value={
                  typeFilter
                }
                onChange={(
                  event
                ) =>
                  setTypeFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  All Types
                </option>

                <option value="income">
                  Income
                </option>

                <option value="expense">
                  Expense
                </option>
              </select>

              <select
                value={
                  categoryFilter
                }
                onChange={(
                  event
                ) =>
                  setCategoryFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  All Categories
                </option>

                <option value="Food">
                  Food
                </option>

                <option value="Bills">
                  Bills
                </option>

                <option value="Transport">
                  Transport
                </option>

                <option value="Shopping">
                  Shopping
                </option>

                <option value="Entertainment">
                  Entertainment
                </option>

                <option value="Salary">
                  Salary
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

            </div>

            {/* TRANSACTION LIST */}

            <div className="transactions-list">

              {filteredTransactions.length ===
              0 ? (
                <div className="empty-state">

                  <Receipt
                    size={40}
                  />

                  <h3>
                    No transactions
                    found
                  </h3>

                  <p>
                    Try changing your
                    filters or add a
                    new transaction.
                  </p>

                </div>
              ) : (
                filteredTransactions.map(
                  (transaction) => (
                    <div
                      className="transaction"
                      key={
                        transaction.id
                      }
                    >

                      <div className="transaction-left">

                        <div
                          className={`transaction-icon ${
                            transaction.type ===
                            "income"
                              ? "transaction-income"
                              : "transaction-expense"
                          }`}
                        >

                          {transaction.type ===
                          "income" ? (
                            <ArrowUpRight
                              size={20}
                            />
                          ) : (
                            <ArrowDownRight
                              size={20}
                            />
                          )}

                        </div>

                        <div className="transaction-info">

                          <h3>
                            {
                              transaction.title
                            }
                          </h3>

                          <div className="transaction-meta">

                            <span>
                              {
                                transaction.category
                              }
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {formatDate(
                                transaction.date
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="transaction-right">

                        <strong
                          className={
                            transaction.type ===
                            "income"
                              ? "income"
                              : "expense"
                          }
                        >
                          {transaction.type ===
                          "income"
                            ? "+"
                            : "-"}
                          ₹
                          {formatAmount(
                            transaction.amount
                          )}
                        </strong>

                        <div className="transaction-actions">

                          <button
                            onClick={() =>
                              openEditForm(
                                transaction
                              )
                            }
                            title="Edit"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            onClick={() =>
                              deleteTransaction(
                                transaction.id
                              )
                            }
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </section>

        </main>

      </div>

      {/* =================================================
          RECURRING TRANSACTION MODAL
      ================================================= */}

      {showRecurringForm && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingRecurringId
                    ? "Edit Recurring Transaction"
                    : "Add Recurring Transaction"}
                </h2>

                <p>
                  {editingRecurringId
                    ? "Update recurring transaction details."
                    : "Set up a repeating income or expense."}
                </p>

              </div>

              <button
                className="close-button"
                onClick={
                  closeRecurringForm
                }
                type="button"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                handleRecurringSubmit
              }
            >

              <label>
                Amount
              </label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                min="1"
                step="0.01"
                value={
                  recurringForm.amount
                }
                onChange={
                  handleRecurringChange
                }
                required
              />

              <label>
                Type
              </label>

              <select
                name="type"
                value={
                  recurringForm.type
                }
                onChange={
                  handleRecurringChange
                }
              >
                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>
              </select>

              <label>
                Category
              </label>

              <select
                name="category"
                value={
                  recurringForm.category
                }
                onChange={
                  handleRecurringChange
                }
                required
              >
                <option value="Food">
                  Food
                </option>

                <option value="Bills">
                  Bills
                </option>

                <option value="Transport">
                  Transport
                </option>

                <option value="Shopping">
                  Shopping
                </option>

                <option value="Entertainment">
                  Entertainment
                </option>

                <option value="Salary">
                  Salary
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              <label>
                Description
              </label>

              <input
                type="text"
                name="description"
                placeholder="e.g. Netflix subscription"
                value={
                  recurringForm.description
                }
                onChange={
                  handleRecurringChange
                }
                maxLength={255}
              />

              <label>
                Frequency
              </label>

              <select
                name="frequency"
                value={
                  recurringForm.frequency
                }
                onChange={
                  handleRecurringChange
                }
                required
              >
                <option value="weekly">
                  Weekly
                </option>

                <option value="monthly">
                  Monthly
                </option>

                <option value="yearly">
                  Yearly
                </option>
              </select>

              <label>
                Start Date
              </label>

              <input
                type="date"
                name="start_date"
                value={
                  recurringForm.start_date
                }
                onChange={
                  handleRecurringChange
                }
                required
              />

              <label>
                End Date
                (Optional)
              </label>

              <input
                type="date"
                name="end_date"
                value={
                  recurringForm.end_date
                }
                onChange={
                  handleRecurringChange
                }
              />

              <button
                className="submit-button"
                type="submit"
              >
                {editingRecurringId
                  ? "Save Changes"
                  : "Add Recurring Transaction"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          NORMAL TRANSACTION MODAL
      ================================================= */}

      {showForm && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit Transaction"
                    : "Add Transaction"}
                </h2>

                <p>
                  {editingId
                    ? "Update transaction details."
                    : "Add a new income or expense."}
                </p>

              </div>

              <button
                className="close-button"
                onClick={
                  closeForm
                }
                type="button"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <label>
                Transaction Name
              </label>

              <input
                type="text"
                name="title"
                placeholder="e.g. Grocery Shopping"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                required
              />

              <label>
                Amount
              </label>

              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                min="1"
                step="0.01"
                value={
                  formData.amount
                }
                onChange={
                  handleChange
                }
                required
              />

              <label>
                Type
              </label>

              <select
                name="type"
                value={
                  formData.type
                }
                onChange={
                  handleChange
                }
              >
                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>
              </select>

              <label>
                Category
              </label>

              <select
                name="category"
                value={
                  formData.category
                }
                onChange={
                  handleChange
                }
              >
                <option value="Food">
                  Food
                </option>

                <option value="Bills">
                  Bills
                </option>

                <option value="Transport">
                  Transport
                </option>

                <option value="Shopping">
                  Shopping
                </option>

                <option value="Entertainment">
                  Entertainment
                </option>

                <option value="Salary">
                  Salary
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              <label>
                Date
              </label>

              <input
                type="date"
                name="date"
                value={
                  formData.date
                }
                onChange={
                  handleChange
                }
              />

              <button
                className="submit-button"
                type="submit"
              >
                {editingId
                  ? "Save Changes"
                  : "Add Transaction"}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;