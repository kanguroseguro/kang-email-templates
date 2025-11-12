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

## Tools for testing
You can open the html files in chrome via mcp
