import express from "express";
import session from "express-session";
import lusca from "lusca";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set view engine
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// STEP 1 - Session middleware (CSRF needs sessions)
const sessionHandler = session({
  secret: process.env.COOKIE_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 1 // 1 hour
  }
});

app.use(sessionHandler);

// STEP 2 - Enable CSRF protection AFTER session middleware
const csrfMiddleware = lusca.csrf();

app.use((req, res, next) => {
  const isApi = req.path.startsWith("/api") || req.path.startsWith("/cdn") || req.path.startsWith("/v2");
  const isFromBrowser = req.headers.accept && req.headers.accept.includes("text/html");

  // Skip CSRF for API routes and /login POST if not from browser
  const shouldSkipCSRF =
    (isApi && !isFromBrowser) ||
    (req.path === "/login" && req.method === "POST" && !isFromBrowser);

  if (shouldSkipCSRF) {
    return next();
  }

  csrfMiddleware(req, res, (err) => {
    if (err) return next(err);
    if (typeof req.csrfToken === "function") {
      res.locals.csrfToken = req.csrfToken();
    }
    next();
  });
});

// Routes
app.get("/", (req, res) => {
  res.render("index", { csrfToken: req.csrfToken() });
});

app.get("/login", (req, res) => {
  res.render("login", { csrfToken: req.csrfToken() });
});

app.get("/reset-password", (req, res) => {
  res.render("resetPassword", { csrfToken: req.csrfToken() });
});

// POST routes to demonstrate CSRF protection
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // In a real app, validate credentials here
  res.json({ 
    success: true, 
    message: "Login successful",
    data: { username }
  });
});

app.post("/reset-password", (req, res) => {
  const { email } = req.body;
  // In a real app, send reset email here
  res.json({ 
    success: true, 
    message: "Password reset email sent",
    data: { email }
  });
});

// API routes (CSRF protection can be skipped for non-browser requests)
app.post("/api/data", (req, res) => {
  res.json({ 
    success: true, 
    message: "API endpoint - CSRF skipped for non-browser requests",
    data: req.body 
  });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403).render("error", { 
      error: "CSRF token validation failed. Form tampering detected.",
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  } else {
    res.status(500).render("error", { 
      error: err.message || "Internal server error",
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the CSRF protection in action`);
});
