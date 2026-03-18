# kang-email-templates

Minimal MJML email template development setup using bun.

## Structure
```
src/
  customer/           — Customer-facing emails
    ci/               — CloudInsurance templates
    sendgrid/         — SendGrid templates
  agent/              — Agent-facing emails
    sendgrid/         — SendGrid templates
  shared/
    components/       — Reusable MJML partials (head, header, footer)
    base-template.mjml — Starter template
  assets/             — Images (PNGs, SVGs)
dist/                 — Compiled HTML output ({name}.{provider}.{lang}.html)
dist/test/            — Test variants with resolved placeholders
```

### Multilingual (EN/ES)
Each language is a separate file: `{name}.en.mjml` / `{name}.es.mjml`. No inline language conditionals.

Shared components (`shared/components/`) contain **zero** provider-specific syntax — they are pure MJML content with language variants (`header.en.mjml`, `header.es.mjml`, `footer.en.mjml`, `footer.es.mjml`).

Provider-specific variable syntax (`[var]`, `{{var}}`) only appears in template files.

Build output naming: `dist/{name}.{provider}.{lang}.html` (e.g., `otp.sg.en.html`, `client-welcome.ci.es.html`).

### Template → Provider × Language Map

| Template | Location | Provider | Languages |
|---|---|---|---|
| `client-welcome` | `customer/ci/` | CI | EN, ES |
| `general` | `customer/ci/` | CI | EN, ES |
| `client-welcome` | `customer/sendgrid/` | SendGrid | EN, ES |
| `otp` | `agent/sendgrid/` | SendGrid | EN, ES |
| `agent-welcome` | `agent/sendgrid/` | SendGrid | EN, ES |
| `rejection` | `agent/sendgrid/` | SendGrid | EN only (legal text) |

## Commands
- `bun run build` - Compile all MJML templates once
- `bun run watch` - Auto-compile on file changes
- `bun run test-variations` - Generate test variants (HTML + plain text) into `dist/test/`
- `bun run deploy:staging [template]` - Build + push as inactive SendGrid version
- `bun run deploy:status [template]` - Show active vs staged versions
- `bun run deploy:promote [template] --confirm` - Activate the latest staged version (goes live)
- `bun run deploy:rollback <template> --confirm` - Re-activate the previous version

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
- **Language** — Bilingual EN/ES. Each language is a separate MJML file. Shared components are language-specific but provider-agnostic. Legal disclaimer stays English in both variants (US regulatory requirement).
- **Pet species** — Generic paw icon for all pets. CI has no species conditionals. Can revisit if CI adds them later.
- **Image hosting** — All assets served from `https://kang-email-templates.vercel.app/assets/`. 12 PNGs, all verified live.
- **SendGrid multilingual** — Each language variant is a separate SendGrid template ID. Backend selects the right template based on user language preference.
- **CI multilingual** — EN and ES templates uploaded separately to CI admin. CI sends the right one based on customer language.

## To Decide
- **Email subject line** — needs to be defined for the client-welcome (Policy) template.

## CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `preview.yml` | PR to `main` | Build MJML, stage inactive versions on SendGrid, post PR comment with editor links |
| `promote.yml` | Push to `main` (merge) | Build, promote SendGrid templates to live |

Vercel handles preview deployments automatically per PR. Append `/test/` to the Vercel preview URL to browse all template previews.

### Branch Protection
`main` requires PRs — no direct push. Admins can bypass.

### Deployment Flow

```
1. Create branch, edit MJML in src/
2. Open PR → runs automatically:
   - Vercel deploys a preview (append /test/ to browse all previews)
   - GitHub Actions stages inactive versions on SendGrid with test data
   - PR comment posted with SendGrid editor links
3. Review in SendGrid UI (send test emails from editor)
4. Merge PR → promote.yml activates staged SendGrid versions (goes live)
5. If something breaks: `bun run deploy:rollback <template> --confirm`
```

### SendGrid Templates

| Template | Template ID (EN) | Template ID (ES) | Subject (EN) |
|----------|-----------------|-----------------|--------------|
| `otp` | `d-487466fc9ae2424aa1638917dd476bf4` | TBD (auto-created) | Your password for Kanguro |
| `agent-welcome` | `d-0a1d6e5465c64669aa3c500cb7fa50af` | TBD | Welcome to Kanguro |
| `rejection` | `d-2c07f8ba50e44e608df7d6c266cc6f39` | N/A (EN only) | Coverage Unavailable |
| `client-welcome` | `d-ce25117b7c964567a7fb84d5a46140a6` | TBD | Welcome to Kanguro! |

Config in `deploy.js` `SENDGRID_TEMPLATES` object. Test data auto-loaded from `providers.js`.

### Secrets
- `SENDGRID_API_KEY` — GitHub repo secret (scopes: `templates.*`, `email_testing.*`, stats). No `mail.send`.

### Previews
Vercel: https://kang-email-templates.vercel.app/test/ (production)
PR previews: Vercel auto-deploys per PR (check Vercel bot comment, append `/test/`)

### Pending: CI and HubSpot Deployment
- **CloudInsurance** — currently manual (paste HTML into CI admin UI). No API available yet for automated deployment.
- **HubSpot** — no templates built yet. When added, deployment via HubSpot API or manual upload TBD.

### Local Deploy (without CI)
Requires `SENDGRID_API_KEY` via mise (`.mise.local.toml`, gitignored):
```
bun run deploy:staging          # push inactive versions
bun run deploy:status           # check active vs staged
bun run deploy:promote --confirm  # go live
```

## Local Testing
- Open `dist/test/index.html` in Chrome to browse all test variants
- Individual variants can be opened directly (e.g. `dist/test/otp-en.html`, `dist/test/otp-es.html`)
- Plain text versions generated alongside (e.g. `dist/test/otp-en.txt`)
- Chrome DevTools MCP is available for opening files in the browser
