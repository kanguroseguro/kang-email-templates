# Kanguro Email Templates

MJML email templates for Kanguro Insurance — pet and renters insurance.

Built with [MJML](https://mjml.io), deployed via GitHub Actions to [SendGrid](https://sendgrid.com) and [CloudInsurance](https://cloudinsurance.io).

## Quick Start

```bash
bun install
bun run build        # compile MJML → HTML
bun run watch        # auto-compile on save
bun run test-variations  # generate previews into dist/test/
```

Open `dist/test/index.html` to browse all template previews.

## Templates

| Template | Provider | Description |
|----------|----------|-------------|
| `client-welcome` | CloudInsurance | Auto-sent when a policy is created |
| `general` | CloudInsurance | On-demand email from handler |
| `otp` | SendGrid | One-time password for login |
| `agent-welcome` | SendGrid | Welcome email for new agents |
| `rejection` | SendGrid | Application rejection notification |

## Project Structure

```
src/                    MJML source templates
src/components/         Shared partials (head, header, footer)
src/assets/             Image assets (icons, badges, QR)
dist/                   Compiled HTML output
dist/test/              Preview variants with resolved placeholders
providers.js            Provider templating engines (CI / SendGrid / HubSpot)
deploy.js               SendGrid deploy CLI (staging / promote / rollback)
html-to-text.js         HTML → plain text converter
template-loader.js      Provider-aware loader for kanguro-backend
test-variations.js      Generates preview variants per provider
```

## Deployment

### Via Pull Request (recommended)

1. Create a branch and edit templates in `src/`
2. Open a PR to `main`
3. Automatically:
   - Vercel deploys a preview (append `/test/` to browse all previews)
   - GitHub Actions stages inactive versions on SendGrid with test data
   - A PR comment is posted with SendGrid editor links
4. Review and send test emails from the SendGrid editor
5. Merge the PR — templates are promoted to live automatically

### Manual (local)

Requires `SENDGRID_API_KEY` (set via [mise](https://mise.jdx.dev) in `.mise.local.toml`):

```bash
bun run deploy:staging           # push inactive versions to SendGrid
bun run deploy:status            # show active vs staged
bun run deploy:promote --confirm # activate staged versions
bun run deploy:rollback otp --confirm  # revert a template
```

### CloudInsurance Templates

CI templates (`client-welcome`, `general`) are deployed manually via the CI admin UI:
**Settings → Partner Admin → Mail Templates (Beta)**

### HubSpot Templates

Not yet implemented. Deployment method TBD.

## Preview Site

Production: https://kang-email-templates.vercel.app/test/

PR previews are deployed automatically by Vercel — append `/test/` to the preview URL.
