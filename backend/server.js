const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "expense_tracker_secret_key";

app.use(cors());
app.use(express.json());

// =========================================================
// DATABASE
// =========================================================

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Neon PostgreSQL requires SSL.
  // Local PostgreSQL does not need SSL.
  ssl: process.env.DB_HOST?.includes("neon.tech")
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

// =========================================================
// HEALTH
// =========================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is healthy",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      message: "PostgreSQL connected successfully",
    });
  } catch (error) {
    console.error(
      "Database health error:",
      error.message
    );

    res.status(500).json({
      status: "ERROR",
      message: "PostgreSQL connection failed",
    });
  }
});

// =========================================================
// AUTH - SIGNUP
// =========================================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [normalizedEmail]
      );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
      ]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      message:
        "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error(
      "Signup error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to create account",
    });
  }
});

// =========================================================
// AUTH - LOGIN
// =========================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to login",
    });
  }
});

// =========================================================
// AUTH MIDDLEWARE
// =========================================================

function authenticateToken(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message:
        "Authentication required",
    });
  }

  const token =
    authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message:
        "Invalid authentication token",
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message:
        "Invalid or expired token",
    });
  }
}

// =========================================================
// CURRENT USER
// =========================================================

app.get(
  "/api/auth/me",
  authenticateToken,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `SELECT
             id,
             name,
             email,
             created_at
           FROM users
           WHERE id = $1`,
          [req.user.userId]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "Get user error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to get user",
      });
    }
  }
);

// =========================================================
// DATE HELPERS
// =========================================================

function parseDateOnly(
  dateString
) {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
}

function formatDateOnly(date) {
  return date
    .toISOString()
    .split("T")[0];
}

function addDays(
  date,
  days
) {
  const result =
    new Date(date);

  result.setUTCDate(
    result.getUTCDate() +
      days
  );

  return result;
}

function addMonths(
  date,
  months
) {
  const year =
    date.getUTCFullYear();

  const month =
    date.getUTCMonth();

  const day =
    date.getUTCDate();

  const result =
    new Date(
      Date.UTC(
        year,
        month + months,
        1
      )
    );

  const lastDay =
    new Date(
      Date.UTC(
        result.getUTCFullYear(),
        result.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

  result.setUTCDate(
    Math.min(
      day,
      lastDay
    )
  );

  return result;
}

function getNextOccurrence(
  currentDate,
  frequency
) {
  if (frequency === "weekly") {
    return addDays(
      currentDate,
      7
    );
  }

  if (frequency === "monthly") {
    return addMonths(
      currentDate,
      1
    );
  }

  if (frequency === "yearly") {
    return addMonths(
      currentDate,
      12
    );
  }

  return null;
}

// =========================================================
// AUTOMATIC RECURRING GENERATION
// =========================================================

async function generateRecurringTransactions(
  userId
) {
  try {
    const recurringResult =
      await pool.query(
        `SELECT *
         FROM recurring_transactions
         WHERE user_id = $1
         ORDER BY id ASC`,
        [userId]
      );

    const today = new Date();

    const todayString =
      formatDateOnly(today);

    const todayDate =
      parseDateOnly(
        todayString
      );

    for (const recurring of
      recurringResult.rows) {

      let occurrenceDate =
        parseDateOnly(
          formatDateOnly(
            new Date(
              recurring.start_date
            )
          )
        );

      const endDate =
        recurring.end_date
          ? parseDateOnly(
              formatDateOnly(
                new Date(
                  recurring.end_date
                )
              )
            )
          : null;

      // Future recurring transaction
      if (
        occurrenceDate >
        todayDate
      ) {
        continue;
      }

      while (
        occurrenceDate <=
        todayDate
      ) {
        if (
          endDate &&
          occurrenceDate >
            endDate
        ) {
          break;
        }

        const occurrenceString =
          formatDateOnly(
            occurrenceDate
          );

        await pool.query(
          `INSERT INTO transactions
           (
             user_id,
             type,
             amount,
             category,
             description,
             transaction_date,
             recurring_transaction_id,
             recurring_occurrence_date
           )
           VALUES
           (
             $1,
             $2,
             $3,
             $4,
             $5,
             $6,
             $7,
             $8
           )
           ON CONFLICT
           (
             recurring_transaction_id,
             recurring_occurrence_date
           )
           DO NOTHING`,
          [
            userId,
            recurring.type,
            recurring.amount,
            recurring.category,
            recurring.description,
            occurrenceString,
            recurring.id,
            occurrenceString,
          ]
        );

        const nextOccurrence =
          getNextOccurrence(
            occurrenceDate,
            recurring.frequency
          );

        if (!nextOccurrence) {
          break;
        }

        occurrenceDate =
          nextOccurrence;
      }
    }
  } catch (error) {
    console.error(
      "Recurring generation error:",
      error.message
    );

    throw error;
  }
}

// =========================================================
// TRANSACTIONS - GET
// =========================================================

app.get(
  "/api/transactions",
  authenticateToken,
  async (req, res) => {
    try {

      // Generate any missing
      // recurring transactions
      await generateRecurringTransactions(
        req.user.userId
      );

      const result =
        await pool.query(
          `SELECT *
           FROM transactions
           WHERE user_id = $1
           ORDER BY
             transaction_date DESC,
             id DESC`,
          [req.user.userId]
        );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Get transactions error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch transactions",
      });
    }
  }
);

// =========================================================
// TRANSACTIONS - ADD
// =========================================================

app.post(
  "/api/transactions",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        type,
        amount,
        category,
        description,
        transaction_date,
      } = req.body;

      if (
        !type ||
        !amount ||
        !category
      ) {
        return res.status(400).json({
          message:
            "Type, amount and category are required",
        });
      }

      const result =
        await pool.query(
          `INSERT INTO transactions
           (
             user_id,
             type,
             amount,
             category,
             description,
             transaction_date
           )
           VALUES
           (
             $1,
             $2,
             $3,
             $4,
             $5,
             $6
           )
           RETURNING *`,
          [
            req.user.userId,
            type,
            amount,
            category,
            description || null,
            transaction_date ||
              formatDateOnly(
                new Date()
              ),
          ]
        );

      res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Add transaction error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to add transaction",
      });
    }
  }
);

// =========================================================
// TRANSACTIONS - UPDATE
// =========================================================

app.put(
  "/api/transactions/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        type,
        amount,
        category,
        description,
        transaction_date,
      } = req.body;

      const result =
        await pool.query(
          `UPDATE transactions
           SET
             type = $1,
             amount = $2,
             category = $3,
             description = $4,
             transaction_date = $5
           WHERE
             id = $6
             AND user_id = $7
           RETURNING *`,
          [
            type,
            amount,
            category,
            description || null,
            transaction_date,
            id,
            req.user.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          message:
            "Transaction not found",
        });
      }

      res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Update transaction error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update transaction",
      });
    }
  }
);

// =========================================================
// TRANSACTIONS - DELETE
// =========================================================

app.delete(
  "/api/transactions/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const result =
        await pool.query(
          `DELETE FROM transactions
           WHERE
             id = $1
             AND user_id = $2
           RETURNING *`,
          [
            id,
            req.user.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          message:
            "Transaction not found",
        });
      }

      res.json({
        message:
          "Transaction deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete transaction error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to delete transaction",
      });
    }
  }
);

// =========================================================
// RECURRING TRANSACTIONS - GET
// =========================================================

app.get(
  "/api/recurring-transactions",
  authenticateToken,
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `SELECT *
           FROM recurring_transactions
           WHERE user_id = $1
           ORDER BY
             start_date DESC,
             id DESC`,
          [req.user.userId]
        );

      res.json(
        result.rows
      );
    } catch (error) {
      console.error(
        "Get recurring transactions error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to fetch recurring transactions",
      });
    }
  }
);

// =========================================================
// RECURRING TRANSACTIONS - ADD
// =========================================================

app.post(
  "/api/recurring-transactions",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        type,
        amount,
        category,
        description,
        frequency,
        start_date,
        end_date,
      } = req.body;

      if (
        !type ||
        !amount ||
        !category ||
        !frequency ||
        !start_date
      ) {
        return res.status(400).json({
          message:
            "Type, amount, category, frequency and start date are required",
        });
      }

      if (
        ![
          "weekly",
          "monthly",
          "yearly",
        ].includes(
          frequency
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid frequency",
        });
      }

      if (
        end_date &&
        end_date < start_date
      ) {
        return res.status(400).json({
          message:
            "End date cannot be before start date",
        });
      }

      const result =
        await pool.query(
          `INSERT INTO recurring_transactions
           (
             user_id,
             type,
             amount,
             category,
             description,
             frequency,
             start_date,
             end_date
           )
           VALUES
           (
             $1,
             $2,
             $3,
             $4,
             $5,
             $6,
             $7,
             $8
           )
           RETURNING *`,
          [
            req.user.userId,
            type,
            amount,
            category,
            description || null,
            frequency,
            start_date,
            end_date || null,
          ]
        );

      const recurring =
        result.rows[0];

      // Immediately generate
      // due occurrences.
      await generateRecurringTransactions(
        req.user.userId
      );

      res.status(201).json(
        recurring
      );
    } catch (error) {
      console.error(
        "Add recurring transaction error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to add recurring transaction",
      });
    }
  }
);

// =========================================================
// RECURRING TRANSACTIONS - UPDATE
// =========================================================

app.put(
  "/api/recurring-transactions/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        type,
        amount,
        category,
        description,
        frequency,
        start_date,
        end_date,
      } = req.body;

      if (
        !type ||
        !amount ||
        !category ||
        !frequency ||
        !start_date
      ) {
        return res.status(400).json({
          message:
            "Type, amount, category, frequency and start date are required",
        });
      }

      if (
        ![
          "weekly",
          "monthly",
          "yearly",
        ].includes(
          frequency
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid frequency",
        });
      }

      if (
        end_date &&
        end_date < start_date
      ) {
        return res.status(400).json({
          message:
            "End date cannot be before start date",
        });
      }

      const result =
        await pool.query(
          `UPDATE recurring_transactions
           SET
             type = $1,
             amount = $2,
             category = $3,
             description = $4,
             frequency = $5,
             start_date = $6,
             end_date = $7
           WHERE
             id = $8
             AND user_id = $9
           RETURNING *`,
          [
            type,
            amount,
            category,
            description || null,
            frequency,
            start_date,
            end_date || null,
            id,
            req.user.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          message:
            "Recurring transaction not found",
        });
      }

      await generateRecurringTransactions(
        req.user.userId
      );

      res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Update recurring transaction error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update recurring transaction",
      });
    }
  }
);

// =========================================================
// RECURRING TRANSACTIONS - DELETE
// =========================================================

app.delete(
  "/api/recurring-transactions/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const result =
        await pool.query(
          `DELETE FROM recurring_transactions
           WHERE
             id = $1
             AND user_id = $2
           RETURNING *`,
          [
            id,
            req.user.userId,
          ]
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          message:
            "Recurring transaction not found",
        });
      }

      res.json({
        message:
          "Recurring transaction deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete recurring transaction error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to delete recurring transaction",
      });
    }
  }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);