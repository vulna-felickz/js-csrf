# js-csrf

A sample Node.js application demonstrating CSRF (Cross-Site Request Forgery) protection using the Lusca middleware with Express.js.

This repository reproduces the CSRF vulnerability fix implementation described in [this StackOverflow question](https://stackoverflow.com/questions/79719352/csrf-vulnerability-in-nodejs).

## Features

- ✅ **Session-based CSRF Protection**: Uses express-session to manage CSRF tokens
- ✅ **Lusca Middleware**: Implements CSRF protection with the lusca library
- ✅ **Conditional CSRF**: Skips CSRF validation for API routes when not accessed from browsers
- ✅ **Form Integration**: Demonstrates CSRF tokens in HTML forms
- ✅ **Multiple Scenarios**: Login and password reset forms with CSRF protection

## Implementation Steps

### STEP 1: Install and Enable Sessions
CSRF protection requires session management to store tokens securely.

```bash
npm install express-session lusca
```

### STEP 2: Configure CSRF Middleware
The application implements conditional CSRF protection that:
- **Protects** all browser-based form submissions
- **Skips** protection for API routes when accessed via non-browser clients (e.g., Postman, curl)
- **Validates** CSRF tokens on all POST requests from browsers

```javascript
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
```

### STEP 3: Add CSRF Tokens to Forms
Each form includes a hidden field with the CSRF token:

```html
<form method="POST" action="/login">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- form fields -->
</form>
```

## Installation

```bash
# Clone the repository
git clone https://github.com/vulna-felickz/js-csrf.git
cd js-csrf

# Install dependencies
npm install

# Start the server
npm start
```

## Usage

1. Start the application:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. Try the protected forms:
   - **Login Form**: `/login`
   - **Reset Password Form**: `/reset-password`

4. Test CSRF protection:
   - Forms with valid tokens will succeed
   - Tampering with or removing the `_csrf` field will result in a 403 error

## API Testing

API routes can be tested without CSRF tokens when using non-browser clients:

```bash
# This will work (non-browser request to API)
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# This will also work (non-browser request to login)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

## Project Structure

```
js-csrf/
├── server.js              # Main application file
├── package.json           # Project dependencies
├── views/                 # EJS templates
│   ├── index.ejs         # Home page
│   ├── login.ejs         # Login form with CSRF
│   ├── resetPassword.ejs # Password reset form with CSRF
│   └── error.ejs         # Error page
└── README.md             # This file
```

## Security Features

- **CSRF Token Validation**: All browser-based POST requests are validated
- **Session-based Tokens**: Tokens are stored in server-side sessions
- **SameSite Cookie**: Cookies use `SameSite=lax` to prevent CSRF
- **HttpOnly Flag**: Session cookies are marked as HttpOnly
- **Conditional Protection**: API routes can skip CSRF for programmatic access

## References

- [Lusca Documentation](https://github.com/krakenjs/lusca)
- [Express Session Documentation](https://github.com/expressjs/session)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## License

MIT
