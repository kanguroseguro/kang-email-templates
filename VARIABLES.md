# Email Template Variables

All email templates use the `{{variableName}}` syntax for dynamic content replacement.

## Variable Naming Convention
- Use **camelCase** for variable names (e.g., `firstName`, `otpCode`)
- Keep names descriptive and concise
- Avoid spaces, special characters, or underscores

## Available Templates and Variables

### `otp.html`
One-time password email for agency portal login.

**Variables:**
- `{{otpCode}}` - The 6-digit one-time password code

**Example:**
```javascript
import { loadTemplate } from './template-loader.js';

const html = loadTemplate('otp', {
  otpCode: '123456'
});
```

---

### `agent-welcome.html`
Welcome email sent to new agents with portal access details.

**Variables:**
- `{{firstName}}` - Agent's first name
- `{{email}}` - Agent's email address for login

**Example:**
```javascript
import { loadTemplate } from './template-loader.js';

const html = loadTemplate('agent-welcome', {
  firstName: 'Maria',
  email: 'maria.garcia@example.com'
});
```

---

## Using the Template Loader

### Basic Usage

```javascript
import { loadTemplate } from './template-loader.js';

// Load and populate template
const html = loadTemplate('otp', { otpCode: '987654' });

// Send email (example with nodemailer)
await transporter.sendMail({
  to: 'user@example.com',
  subject: 'Your OTP Code',
  html: html
});
```

### Manual Variable Replacement

If you prefer not to use the loader utility:

```javascript
import { readFileSync } from 'fs';

// Load template
let html = readFileSync('./dist/otp.html', 'utf-8');

// Replace variables
html = html.replace(/{{otpCode}}/g, '123456');
```

---

## Adding New Variables

When adding variables to MJML templates:

1. Use the `{{variableName}}` syntax in your `.mjml` file
2. Rebuild templates: `bun run build`
3. Document the new variable in this file
4. Update the JSDoc comment in `template-loader.js`

**Example:**
```xml
<!-- In your .mjml file -->
<mj-text>
  Hello {{firstName}}, your account expires on {{expirationDate}}.
</mj-text>
```
