import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';

// --- All email templates and their variations ---

const templates = [
  {
    id: 'client-welcome',
    label: 'Client Welcome',
    description: 'Policy template — auto-sent on policy creation',
    color: '#F87872',
    source: 'dist/client-welcome.html',
    variations: [
      {
        name: 'pet-dog',
        label: 'Pet — Dog (Louis)',
        placeholders: {
          customer_firstname: 'Zelda',
          customer_name: 'Zelda Abarquez',
          prefixed_customer_id: 'KS10005813',
          prefixed_policy_id: '20033288',
          policy_startdate: '12/19/2025',
          policy_enddate: '12/18/2026',
          policy_product_name: 'Kanguro Pet Insurance',
          policy_product_name_short: 'Kanguro Pet',
          pet_single_name: 'Louis',
        },
        conditions: {
          recipient_is_customer: true,
          policy_product_has_pet: true,
        },
      },
      {
        name: 'pet-cat',
        label: 'Pet — Cat (Whiskers)',
        placeholders: {
          customer_firstname: 'James',
          customer_name: 'James Wilson',
          prefixed_customer_id: 'KS10009102',
          prefixed_policy_id: '20051847',
          policy_startdate: '02/01/2026',
          policy_enddate: '01/31/2027',
          policy_product_name: 'Kanguro Pet Insurance',
          policy_product_name_short: 'Kanguro Pet',
          pet_single_name: 'Whiskers',
        },
        conditions: {
          recipient_is_customer: true,
          policy_product_has_pet: true,
        },
      },
      {
        name: 'pet-long-name',
        label: 'Pet — Long names',
        placeholders: {
          customer_firstname: 'Alejandro',
          customer_name: 'Alejandro Fernández de la Cruz',
          prefixed_customer_id: 'KS10012847',
          prefixed_policy_id: '20078934',
          policy_startdate: '06/15/2026',
          policy_enddate: '06/14/2027',
          policy_product_name: 'Kanguro Pet Insurance',
          policy_product_name_short: 'Kanguro Pet',
          pet_single_name: 'Sir Barksalot McFluffington',
        },
        conditions: {
          recipient_is_customer: true,
          policy_product_has_pet: true,
        },
      },
      {
        name: 'renters-fl',
        label: 'Renters — Florida',
        placeholders: {
          customer_firstname: 'Maria',
          customer_name: 'Maria González',
          prefixed_customer_id: 'KS10007421',
          prefixed_policy_id: '20045612',
          policy_startdate: '01/15/2026',
          policy_enddate: '01/14/2027',
          policy_product_name: 'Kanguro Renter Insurance Florida',
          policy_product_name_short: 'Kanguro Renter FL',
          pet_single_name: '',
        },
        conditions: {
          recipient_is_customer: true,
          policy_product_has_pet: false,
        },
      },
      {
        name: 'renters-tx',
        label: 'Renters — Texas',
        placeholders: {
          customer_firstname: 'Carlos',
          customer_name: 'Carlos Rivera',
          prefixed_customer_id: 'KS10011235',
          prefixed_policy_id: '20062390',
          policy_startdate: '03/01/2026',
          policy_enddate: '02/28/2027',
          policy_product_name: 'Kanguro Renter Insurance Texas',
          policy_product_name_short: 'Kanguro Renter TX',
          pet_single_name: '',
        },
        conditions: {
          recipient_is_customer: true,
          policy_product_has_pet: false,
        },
      },
      {
        name: 'renters-long-name',
        label: 'Renters — Long names (GA)',
        placeholders: {
          customer_firstname: 'Christopher',
          customer_name: 'Christopher Williamson-Montgomery',
          prefixed_customer_id: 'KS10015678',
          prefixed_policy_id: '20091256',
          policy_startdate: '04/01/2026',
          policy_enddate: '03/31/2027',
          policy_product_name: 'Kanguro Renter Insurance Georgia',
          policy_product_name_short: 'Kanguro Renter GA',
          pet_single_name: '',
        },
        conditions: {
          recipient_is_customer: true,
          policy_product_has_pet: false,
        },
      },
    ],
  },
  {
    id: 'otp',
    label: 'OTP',
    description: 'One-time password for agency portal login',
    color: '#002454',
    source: 'dist/otp.html',
    variations: [],
  },
  {
    id: 'agent-welcome',
    label: 'Agent Welcome',
    description: 'Welcome email for new agents with portal access',
    color: '#002454',
    source: 'dist/agent-welcome.html',
    variations: [],
  },
  {
    id: 'rejection',
    label: 'Rejection',
    description: 'Application rejection notification',
    color: '#E74C3C',
    source: 'dist/rejection.html',
    variations: [],
  },
  {
    id: 'base-template',
    label: 'Base Template',
    description: 'Shared layout skeleton for reference',
    color: '#999',
    source: 'dist/base-template.html',
    variations: [],
  },
];

// --- CI conditional engine ---

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveCondition(name, conditions) {
  if (name.startsWith('not_')) {
    const positive = name.substring(4);
    if (positive in conditions) return !conditions[positive];
  }
  if (name in conditions) return conditions[name];
  return false;
}

function processConditionals(html, conditions) {
  let result = html;
  let changed = true;
  while (changed) {
    changed = false;
    const names = new Set();
    for (const m of result.matchAll(/\[if_((?:not_)?[^\]]+)\]/g)) {
      names.add(m[1]);
    }
    for (const name of names) {
      const esc = escapeRegex(name);
      const re = new RegExp(
        `\\[if_${esc}\\]((?:(?!\\[if_${esc}\\]|\\[/if_${esc}\\])[\\s\\S])*?)\\[/if_${esc}\\]`,
        'g'
      );
      const keep = resolveCondition(name, conditions);
      const next = result.replace(re, (_, content) => keep ? content : '');
      if (next !== result) {
        changed = true;
        result = next;
      }
    }
  }
  return result;
}

function replacePlaceholders(html, placeholders) {
  let result = html;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replaceAll(`[${key}]`, value);
  }
  return result;
}

// --- Generate ---

mkdirSync('dist/test', { recursive: true });

let totalVariations = 0;

// Build row HTML for each template
const rows = templates.map((tpl) => {
  let cards = '';

  if (tpl.variations.length > 0) {
    const html = readFileSync(tpl.source, 'utf-8');
    for (const v of tpl.variations) {
      let result = processConditionals(html, v.conditions);
      result = replacePlaceholders(result, v.placeholders);
      writeFileSync(`dist/test/${v.name}.html`, result);
      totalVariations++;

      cards += `
        <a class="card" href="${v.name}.html" target="_blank">
          <div class="thumb"><iframe src="${v.name}.html" tabindex="-1" loading="lazy"></iframe></div>
          <div class="info">
            <div class="card-label">${v.label}</div>
            <div class="card-meta">${v.placeholders.customer_name || ''}</div>
          </div>
        </a>`;
    }
  } else {
    const relPath = `../${tpl.id}.html`;
    cards += `
      <a class="card" href="${relPath}" target="_blank">
        <div class="thumb"><iframe src="${relPath}" tabindex="-1" loading="lazy"></iframe></div>
        <div class="info">
          <div class="card-label">${tpl.label}</div>
          <div class="card-meta">No variations</div>
        </div>
      </a>`;
    totalVariations++;
  }

  return `
    <div class="row">
      <div class="row-header" style="border-left-color: ${tpl.color};">
        <h2>${tpl.label}</h2>
        <p>${tpl.description}</p>
        <span class="badge">${tpl.variations.length || 1}</span>
      </div>
      <div class="row-cards">
        ${cards}
      </div>
    </div>`;
});

const index = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kanguro Email Templates</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; background: #f0ede8; min-height: 100vh; }

  nav { background: #002454; color: #fff; padding: 20px 32px; position: sticky; top: 0; z-index: 10; }
  nav h1 { font-size: 20px; font-weight: 700; }
  nav p { font-size: 12px; opacity: 0.6; margin-top: 2px; }

  .board { display: flex; flex-direction: column; gap: 24px; padding: 24px; }

  .row { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .row-header {
    padding: 16px 20px 12px; border-left: 4px solid #ccc; position: relative;
    border-bottom: 1px solid #eee;
  }
  .row-header h2 { font-size: 16px; font-weight: 700; color: #002454; }
  .row-header p { font-size: 12px; color: #888; margin-top: 2px; }
  .badge {
    position: absolute; top: 16px; right: 20px;
    background: #f0ede8; font-size: 11px; font-weight: 700; color: #666;
    width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }

  .row-cards {
    padding: 12px; display: flex; gap: 12px; overflow-x: auto;
  }

  .card {
    flex: 0 0 260px; background: #f8f7f5; border-radius: 8px; overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: transform 0.15s, box-shadow 0.15s;
    text-decoration: none; color: inherit; display: block;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

  .thumb { height: 180px; overflow: hidden; border-bottom: 1px solid #eee; background: #fff; }
  .thumb iframe {
    width: 200%; height: 200%; transform: scale(0.5); transform-origin: top left;
    pointer-events: none; border: 0;
  }

  .info { padding: 10px 14px; }
  .card-label { font-size: 13px; font-weight: 600; color: #002454; }
  .card-meta { font-size: 11px; color: #999; margin-top: 2px; }
</style>
</head><body>
<nav>
  <h1>Kanguro Email Templates</h1>
  <p>${templates.length} templates &middot; ${totalVariations} total previews</p>
</nav>
<div class="board">
  ${rows.join('\n')}
</div>
</body></html>`;

writeFileSync('dist/test/index.html', index);
console.log(`Generated ${totalVariations} previews across ${templates.length} templates in dist/test/`);
