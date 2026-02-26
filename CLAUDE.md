# kang-email-templates

Minimal MJML email template development setup using bun.

## Structure
- `src/` - MJML templates (`.mjml` files)
- `dist/` - Compiled responsive HTML output

## Commands
- `bun run build` - Compile all MJML templates once
- `bun run watch` - Auto-compile on file changes

## About MJML
MJML is a markup language that transpiles to responsive email HTML. Uses semantic tags like `<mj-section>` and `<mj-column>` instead of nested tables. Responsive by default across all email clients including Outlook.

## About the Kanguro Brand
See BRAND.md

## Docs Reference

### Deployment (CI Platform)
Templates are deployed via **Settings → Partner Admin → Mail Templates (Beta)** in CloudInsurance (CI). The Beta editor supports Markdown. A custom `HTML Layout` can replace the default — send to CI when ready.

### Applicable Email Templates
| Template | Auto | Notes |
|---|---|---|
| General | No | On-demand generic email from handler |
| Quote | Yes | Sent when quote created via API |
| Policy | Yes | Same as quote |
| Policy Renewal | Yes | Renewal email, can be resent manually |
| Policy Cancellation | No | Manual, editable by handler |
| Policy Reinstated | No | Manual, sent on reactivation |
| Invoice Failed | Yes | Payment failed (unknown reason) |
| Payment Received | Yes | Stripe confirmation |
| Autocancellation Notice | Yes | Warning before auto-cancel |
| Autocancellation Completed | Yes | Confirms auto-cancel happened |

### Placeholders
See `docs/Email placeholders.txt` for the full list. Key patterns:
- **Customer**: `[customer_firstname]`, `[customer_name]`, `[partner_name]`, `[portal_url]`
- **Policy**: `[prefixed_policy_id]`, `[policy_startdate]`, `[policy_enddate]`, `[policy_product_name]`, `[transaction_amount_tot]`, `[payment_method]`
- **Claim**: `[prefixed_reference_id]`, `[incident_date]`, `[amount_paid]`, `[pet_single_name]`
- **Conditionals**: `[if_policy_type_USPetInsurance]...[/if_policy_type_USPetInsurance]`, `[if_language_ES]...[/if_language_ES]`, etc.

## To Decide
- **Spanish (ES) version** — current CI plaintext is bilingual (EN + ES in one email). Decide whether the HTML template should be bilingual in a single email, split via `[if_language_US]`/`[if_language_ES]`, or English-only.
- **Email subject line** — needs to be defined for the client-welcome (Order) template.
- **Card icons** — the policy card needs distinct icons per product type: dog, cat, and home/renters. Currently all branches use the same pet icon placeholder. Need CDN assets for each.

## Tools for testing
You can open the html files in chrome via mcp
