#!/usr/bin/env node

/**
 * Deploy email templates to SendGrid.
 *
 * Usage:
 *   bun run deploy:staging              — build + push all SendGrid templates as inactive versions
 *   bun run deploy:staging otp          — push a single template
 *   bun run deploy:status               — show active vs staged versions
 *   bun run deploy:promote              — activate staged versions (with confirmation)
 *   bun run deploy:promote otp          — activate a single staged template
 *   bun run deploy:rollback otp         — re-activate the previous version
 *
 * Requires SENDGRID_API_KEY env var (with templates.* scopes).
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { htmlToPlainText } from './html-to-text.js';
import { testData } from './providers.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY environment variable is required.');
  console.error('Set it in .env or export it in your shell.');
  process.exit(1);
}

const API_BASE = 'https://api.sendgrid.com/v3';
const JSON_OUTPUT = process.argv.includes('--json');

/**
 * Maps repo template names → SendGrid template IDs + subject lines.
 * Only SendGrid templates are listed here.
 */
const SENDGRID_TEMPLATES = {
  otp: {
    templateId: 'd-487466fc9ae2424aa1638917dd476bf4',
    subject: 'Your password for Kanguro \u{1F998}',
    testData: { otpCode: testData.sendgrid.otpCode },
  },
  'agent-welcome': {
    templateId: 'd-0a1d6e5465c64669aa3c500cb7fa50af',
    subject: 'Welcome to Kanguro',
    testData: {
      firstName: testData.sendgrid.firstName,
      email: testData.sendgrid.email,
      sellingLink: testData.sendgrid.sellingLink,
      provider: testData.sendgrid.provider,
    },
  },
  rejection: {
    templateId: 'd-2c07f8ba50e44e608df7d6c266cc6f39',
    subject: 'Coverage Unavailable',
    testData: {},
  },
};

// ---------------------------------------------------------------------------
// SendGrid API helpers
// ---------------------------------------------------------------------------

async function sgFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid API ${res.status}: ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

async function getTemplate(templateId) {
  return sgFetch(`/templates/${templateId}`);
}

async function createVersion(templateId, { name, subject, htmlContent }) {
  return sgFetch(`/templates/${templateId}/versions`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      subject,
      html_content: htmlContent,
      generate_plain_content: true,
      active: 0,
      editor: 'code',
    }),
  });
}

async function setTestData(templateId, versionId, data) {
  return sgFetch(`/templates/${templateId}/versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ test_data: JSON.stringify(data) }),
  });
}

async function activateVersion(templateId, versionId) {
  return sgFetch(`/templates/${templateId}/versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: 1 }),
  });
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function getTargetTemplates(templateArg) {
  if (templateArg) {
    if (!SENDGRID_TEMPLATES[templateArg]) {
      console.error(`Unknown SendGrid template: "${templateArg}"`);
      console.error(`Available: ${Object.keys(SENDGRID_TEMPLATES).join(', ')}`);
      process.exit(1);
    }
    return { [templateArg]: SENDGRID_TEMPLATES[templateArg] };
  }
  return SENDGRID_TEMPLATES;
}

async function commandStaging(templateArg) {
  // Build first
  if (!JSON_OUTPUT) console.log('Building MJML templates...');
  execSync('bun run build', { stdio: JSON_OUTPUT ? 'ignore' : 'inherit' });
  if (!JSON_OUTPUT) console.log('');

  const targets = getTargetTemplates(templateArg);
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const results = [];

  for (const [name, config] of Object.entries(targets)) {
    const htmlPath = `dist/${name}.html`;
    if (!existsSync(htmlPath)) {
      if (!JSON_OUTPUT) console.error(`  [SKIP] ${name}: ${htmlPath} not found after build`);
      continue;
    }

    const htmlContent = readFileSync(htmlPath, 'utf-8');
    const plainText = htmlToPlainText(htmlContent);
    const versionName = `staging ${timestamp}`;

    if (!JSON_OUTPUT) {
      console.log(`  ${name}:`);
      console.log(`    HTML: ${htmlContent.length.toLocaleString()} chars`);
      console.log(`    Text: ${plainText.length.toLocaleString()} chars`);
    }

    try {
      const version = await createVersion(config.templateId, {
        name: versionName,
        subject: config.subject,
        htmlContent,
      });
      if (!JSON_OUTPUT) console.log(`    Deployed as INACTIVE version "${versionName}" (${version.id})`);
      if (config.testData && Object.keys(config.testData).length > 0) {
        await setTestData(config.templateId, version.id, config.testData);
        if (!JSON_OUTPUT) console.log(`    Test data loaded: ${JSON.stringify(config.testData)}`);
      }
      results.push({
        template: name,
        templateId: config.templateId,
        versionId: version.id,
        versionName,
        editorUrl: `https://mc.sendgrid.com/dynamic-templates/${config.templateId}/version/${version.id}/editor`,
      });
    } catch (err) {
      if (!JSON_OUTPUT) console.error(`    [ERROR] ${err.message}`);
    }
    if (!JSON_OUTPUT) console.log('');
  }

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('Done. Use "bun run deploy:status" to review, then "bun run deploy:promote" to go live.');
  }
}

async function commandStatus(templateArg) {
  const targets = getTargetTemplates(templateArg);

  for (const [name, config] of Object.entries(targets)) {
    try {
      const tpl = await getTemplate(config.templateId);
      const versions = tpl.versions.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );

      const active = versions.find((v) => v.active === 1);
      const staged = versions.filter((v) => v.active === 0);

      console.log(`${name} (${config.templateId}):`);
      if (active) {
        console.log(`  ACTIVE:  "${active.name}" — updated ${active.updated_at}`);
      }
      if (staged.length > 0) {
        for (const s of staged.slice(0, 3)) {
          console.log(`  STAGED:  "${s.name}" — updated ${s.updated_at} [${s.id}]`);
        }
        if (staged.length > 3) {
          console.log(`  ... and ${staged.length - 3} more inactive versions`);
        }
      } else {
        console.log('  (no staged versions)');
      }
      console.log('');
    } catch (err) {
      console.error(`  ${name}: [ERROR] ${err.message}\n`);
    }
  }
}

async function commandPromote(templateArg) {
  const targets = getTargetTemplates(templateArg);
  const toPromote = [];

  // Gather candidates
  for (const [name, config] of Object.entries(targets)) {
    const tpl = await getTemplate(config.templateId);
    const versions = tpl.versions.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
    const staged = versions.find((v) => v.active === 0);
    const active = versions.find((v) => v.active === 1);

    if (!staged) {
      console.log(`${name}: no staged version to promote, skipping.`);
      continue;
    }

    toPromote.push({
      name,
      templateId: config.templateId,
      versionId: staged.id,
      versionName: staged.name,
      currentActive: active?.name || '(none)',
    });
  }

  if (toPromote.length === 0) {
    console.log('Nothing to promote.');
    return;
  }

  // Show what will change
  console.log('\nWill promote the following:');
  for (const p of toPromote) {
    console.log(`  ${p.name}: "${p.currentActive}" → "${p.versionName}"`);
  }

  // Always require explicit --confirm flag to promote (safety measure)
  if (!process.argv.includes('--confirm')) {
    console.log('\nTo promote, re-run with --confirm:');
    console.log(`  SENDGRID_API_KEY=... bun run deploy:promote${templateArg ? ` ${templateArg}` : ''} --confirm`);
    return;
  }

  // Activate
  for (const p of toPromote) {
    try {
      await activateVersion(p.templateId, p.versionId);
      console.log(`  ${p.name}: activated "${p.versionName}"`);
    } catch (err) {
      console.error(`  ${p.name}: [ERROR] ${err.message}`);
    }
  }
  console.log('\nDone. Templates are now live.');
}

async function commandRollback(templateArg) {
  if (!templateArg) {
    console.error('Usage: bun run deploy:rollback <template-name>');
    console.error('Rollback requires a specific template name for safety.');
    process.exit(1);
  }

  const config = SENDGRID_TEMPLATES[templateArg];
  if (!config) {
    console.error(`Unknown template: "${templateArg}"`);
    process.exit(1);
  }

  const tpl = await getTemplate(config.templateId);
  const versions = tpl.versions.sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  );

  const active = versions.find((v) => v.active === 1);
  // Find the most recent inactive version that isn't the current active
  const previous = versions.find((v) => v.active === 0);

  if (!previous) {
    console.error(`${templateArg}: no previous version to roll back to.`);
    process.exit(1);
  }

  console.log(`${templateArg}: rolling back`);
  console.log(`  Current: "${active?.name}" (${active?.updated_at})`);
  console.log(`  Target:  "${previous.name}" (${previous.updated_at})`);

  if (!process.argv.includes('--confirm')) {
    console.log('\nTo rollback, re-run with --confirm:');
    console.log(`  SENDGRID_API_KEY=... bun run deploy:rollback ${templateArg} --confirm`);
    return;
  }

  await activateVersion(config.templateId, previous.id);
  console.log(`  Activated "${previous.name}" — rollback complete.`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const [command, templateArg] = process.argv.slice(2);

switch (command) {
  case 'staging':
    await commandStaging(templateArg);
    break;
  case 'status':
    await commandStatus(templateArg);
    break;
  case 'promote':
    await commandPromote(templateArg);
    break;
  case 'rollback':
    await commandRollback(templateArg);
    break;
  default:
    console.log(`Kanguro Email Template Deploy

Usage:
  bun run deploy:staging [template]    Build + push as inactive SendGrid version
  bun run deploy:status  [template]    Show active vs staged versions
  bun run deploy:promote [template]    Activate the latest staged version (goes live)
  bun run deploy:rollback <template>   Re-activate the previous version

Templates: ${Object.keys(SENDGRID_TEMPLATES).join(', ')}

Flow:
  1. Edit MJML in src/
  2. bun run deploy:staging        → pushes inactive version
  3. Review in SendGrid UI or send test email
  4. bun run deploy:promote        → makes it live
  5. bun run deploy:rollback otp   → if something goes wrong
`);
}
