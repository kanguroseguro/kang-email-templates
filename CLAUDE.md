# kang-email-templates

Minimal MJML email template development setup using bun.

## Structure
- `src/` - MJML templates (`.mjml` files)
- `src/components/` - Shared MJML partials (head, header, footer)
- `src/assets/` - SVG icons (paw, dog, cat, renters)
- `dist/` - Compiled responsive HTML output
- `dist/test/` - Test variants with CI placeholders resolved

## Commands
- `bun run build` - Compile all MJML templates once
- `bun run watch` - Auto-compile on file changes
- `node test-variations.js` - Generate test variants from `dist/client-welcome.html` into `dist/test/`

## About MJML
MJML is a markup language that transpiles to responsive email HTML. Uses semantic tags like `<mj-section>` and `<mj-column>` instead of nested tables. Responsive by default across all email clients including Outlook.

## About the Kanguro Brand
See BRAND.md

## Docs Reference

### Deployment (CI Platform)
Templates are deployed via **Settings → Partner Admin → Mail Templates (Beta)** in CloudInsurance (CI). The Beta editor supports Markdown. A custom `HTML Layout` can replace the default — send to CI when ready.

### Applicable Email Templates
| Template | Kanguro | Auto | Notes |
|---|---|---|---|
| General | Yes | No | On-demand generic email from handler |
| Quote | Yes | Yes | Sent when quote created via API |
| Order | No | No | Between Offer and Policy, used in UW contexts. Not used by Kanguro |
| Policy | Yes | Yes | Auto-sent when policy is created. **`client-welcome.mjml` maps to this** |
| Policy Renewal | Yes | Yes | Renewal email, can be resent manually |
| Policy Cancellation | Yes | No | Manual, editable by handler |
| Policy Reinstated | Yes | No | Manual, sent on reactivation |
| Invoice Failed | Yes | Yes | Payment failed (unknown reason) |
| Payment Received | Yes | Yes | Stripe confirmation |
| Autocancellation Notice | Yes | Yes | Warning before auto-cancel |
| Autocancellation Completed | Yes | Yes | Confirms auto-cancel happened |

### Placeholders
See `docs/Email placeholders.txt` for the full list. Key patterns:
- **Customer**: `[customer_firstname]`, `[customer_name]`, `[partner_name]`, `[portal_url]`
- **Policy**: `[prefixed_policy_id]`, `[policy_startdate]`, `[policy_enddate]`, `[policy_product_name]`, `[transaction_amount_tot]`, `[payment_method]`
- **Claim**: `[prefixed_reference_id]`, `[incident_date]`, `[amount_paid]`, `[pet_single_name]`
- **Conditionals**: `[if_policy_type_USPetInsurance]...[/if_policy_type_USPetInsurance]`, `[if_language_ES]...[/if_language_ES]`, etc.

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
