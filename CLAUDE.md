# kang-email-templates

Minimal MJML email template development setup using bun.

## Structure
- `src/` - MJML templates (`.mjml` files)
- `src/components/` - Shared MJML partials (head, header, footer)
- `src/assets/` - SVG icons (paw, dog, cat, renters)
- `dist/` - Compiled responsive HTML output
- `dist/test/` - Test variants with all provider placeholders resolved
- `providers.js` - Provider database: templating syntax, test data, and variable resolution for CI / SendGrid / HubSpot
- `template-loader.js` - Provider-aware template loader for use by kanguro-backend
- `test-variations.js` - Generates test HTML with real data per provider

## Commands
- `bun run build` - Compile all MJML templates once
- `bun run watch` - Auto-compile on file changes
- `node test-variations.js` - Generate test variants for all templates into `dist/test/`

## About MJML
MJML is a markup language that transpiles to responsive email HTML. Uses semantic tags like `<mj-section>` and `<mj-column>` instead of nested tables. Responsive by default across all email clients including Outlook.

## About the Kanguro Brand
See BRAND.md

## Email Providers

Each template is sent via one of three providers, each with its own templating language:

| Provider | Syntax | Conditionals | Used for |
|---|---|---|---|
| **CloudInsurance (CI)** | `[variable_name]` | `[if_x]...[/if_x]`, `[if_not_x]...[/if_not_x]` | Policy lifecycle emails (auto-sent by CI PAS) |
| **SendGrid** | `{{variableName}}` | `{{#if var}}..{{/if}}`, `{{#unless var}}..{{/unless}}` | App-triggered transactional emails (kanguro-backend) |
| **HubSpot** | `{{ variable_name }}` | `{% if var %}..{% endif %}`, `{% unless var %}..{% endunless %}` | CRM-triggered marketing/transactional emails |

### Template → Provider Map

| Template | Provider | Auto | Notes |
|---|---|---|---|
| `client-welcome` | CI | Yes | Auto-sent when policy created. Maps to CI "Policy" template |
| `general` | CI | No | On-demand generic email from CI handler |
| `otp` | SendGrid | Yes | OTP code for agency portal login |
| `agent-welcome` | SendGrid | Yes | Welcome email with portal access for new agents |
| `rejection` | SendGrid | Yes | Application rejection notification |

### CI-only Email Templates (not yet built)
| Template | Auto | Notes |
|---|---|---|
| Quote | Yes | Sent when quote created via API |
| Policy Renewal | Yes | Renewal email, can be resent manually |
| Policy Cancellation | No | Manual, editable by handler |
| Policy Reinstated | No | Manual, sent on reactivation |
| Invoice Failed | Yes | Payment failed (unknown reason) |
| Payment Received | Yes | Stripe confirmation |
| Autocancellation Notice | Yes | Warning before auto-cancel |
| Autocancellation Completed | Yes | Confirms auto-cancel happened |

### CI Placeholders
See `docs/Email placeholders.txt` for the full list. Key patterns:
- **Customer**: `[customer_firstname]`, `[customer_name]`, `[partner_name]`, `[portal_url]`
- **Policy**: `[prefixed_policy_id]`, `[policy_startdate]`, `[policy_enddate]`, `[policy_product_name]`, `[transaction_amount_tot]`, `[payment_method]`
- **Claim**: `[prefixed_reference_id]`, `[incident_date]`, `[amount_paid]`, `[pet_single_name]`
- **Conditionals**: `[if_policy_type_USPetInsurance]...[/if_policy_type_USPetInsurance]`, `[if_language_ES]...[/if_language_ES]`, etc.

### SendGrid Variables
Defined in kanguro-backend, passed via SendGrid dynamic template API. Supports Handlebars: `{{var}}`, `{{#if}}`, `{{#unless}}`, nested objects via dot notation (`{{provider.OTP}}`).

### HubSpot Variables
Uses HubL (Jinja-like). Variables from CRM contact/deal properties: `{{ contact.firstname }}`, `{{ deal.amount }}`. Conditionals: `{% if %}`, `{% unless %}`.

## Decisions
- **Language** — English-only by default. Spanish can be added later via `[if_language_ES]` conditionals if needed.
- **Pet species** — Generic paw icon for all pets. CI has no species conditionals. Can revisit if CI adds them later.
- **Image hosting** — All assets served from `https://kang-email-templates.vercel.app/assets/`. 12 PNGs, all verified live.

## To Decide
- **Email subject line** — needs to be defined for the client-welcome (Policy) template.

## Tools for testing
- Open `dist/test/index.html` in Chrome to browse all test variants
- Individual variants can be opened directly (e.g. `dist/test/pet-dog.html`)
- Chrome DevTools MCP is available for opening files in the browser
