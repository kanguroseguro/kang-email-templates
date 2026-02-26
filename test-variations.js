import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const html = readFileSync('dist/client-welcome.html', 'utf-8');

const variations = [
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
    label: 'Pet — Long names (Sir Barksalot)',
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
    label: 'Renters — Long names (Georgia)',
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
    // Find all conditional names present
    const names = new Set();
    for (const m of result.matchAll(/\[if_((?:not_)?[^\]]+)\]/g)) {
      names.add(m[1]);
    }
    for (const name of names) {
      const esc = escapeRegex(name);
      // Match innermost (no nested same-name)
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

let index = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Client Welcome — Test Variations</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0ede8; min-height: 100vh; }
  nav { background: #002454; color: #fff; padding: 16px 24px; position: sticky; top: 0; z-index: 10; }
  nav h1 { font-size: 18px; font-weight: 600; }
  nav p { font-size: 12px; opacity: 0.7; margin-top: 2px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 24px; }
  .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.15s; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
  .card a { display: block; text-decoration: none; color: inherit; }
  .card .thumb { height: 200px; overflow: hidden; border-bottom: 1px solid #eee; }
  .card .thumb iframe { width: 200%; height: 200%; transform: scale(0.5); transform-origin: top left; pointer-events: none; border: 0; }
  .card .info { padding: 16px; }
  .card .info h2 { font-size: 15px; color: #002454; margin-bottom: 4px; }
  .card .info small { font-size: 12px; color: #999; }
  .tag { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-right: 4px; }
  .tag-pet { background: #FFF0EE; color: #F87872; }
  .tag-renters { background: #E8F0FE; color: #002454; }
</style>
</head><body>
<nav><h1>Client Welcome — Test Variations</h1><p>${variations.length} variations generated from dist/client-welcome.html</p></nav>
<div class="cards">`;

for (const v of variations) {
  let result = processConditionals(html, v.conditions);
  result = replacePlaceholders(result, v.placeholders);
  writeFileSync(`dist/test/${v.name}.html`, result);

  const tag = v.conditions.policy_product_has_pet
    ? '<span class="tag tag-pet">Pet</span>'
    : '<span class="tag tag-renters">Renters</span>';

  index += `
  <div class="card">
    <a href="${v.name}.html" target="_blank">
      <div class="thumb"><iframe src="${v.name}.html" tabindex="-1"></iframe></div>
      <div class="info">${tag}<h2>${v.label}</h2><small>${v.name}.html · ${v.placeholders.customer_name}</small></div>
    </a>
  </div>`;
}

index += '</div></body></html>';
writeFileSync('dist/test/index.html', index);
console.log(`Generated ${variations.length} variations in dist/test/`);
