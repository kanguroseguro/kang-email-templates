import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { providers, resolveTemplate } from './providers.js';
import { htmlToPlainText } from './html-to-text.js';

// ---------------------------------------------------------------------------
// All email templates, grouped by provider
// ---------------------------------------------------------------------------

const templates = [
  // ======================== CI (CloudInsurance) ========================
  {
    id: 'client-welcome',
    label: 'Client Welcome',
    description: 'Policy template — auto-sent on policy creation',
    provider: 'ci',
    source: 'dist/client-welcome.html',
    variations: [
      {
        name: 'pet-dog',
        label: 'Pet — Dog (Louis)',
        data: {
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
        data: {
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
        data: {
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
        data: {
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
        data: {
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
        data: {
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
    id: 'general',
    label: 'General',
    description: 'On-demand generic email from CI handler',
    provider: 'ci',
    source: 'dist/general.html',
    variations: [
      {
        name: 'general-default',
        label: 'Default message',
        data: {
          email_subject: 'Important Update About Your Policy',
          email_body: 'Dear Zelda,<br/><br/>We wanted to let you know about an important update to your Kanguro policy. Please review the details in your customer portal or contact us if you have any questions.<br/><br/>Best regards,<br/>The Kanguro Team',
        },
        conditions: {},
      },
    ],
  },

  // ======================== SendGrid ========================
  {
    id: 'otp',
    label: 'OTP',
    description: 'One-time password for agency portal login',
    provider: 'sendgrid',
    source: 'dist/otp.html',
    variations: [
      {
        name: 'otp-default',
        label: 'Default OTP code',
        data: {
          otpCode: '847293',
        },
      },
    ],
  },
  {
    id: 'agent-welcome',
    label: 'Agent Welcome',
    description: 'Welcome email for new agents with portal access',
    provider: 'sendgrid',
    source: 'dist/agent-welcome.html',
    variations: [
      {
        name: 'agent-welcome-otp',
        label: 'OTP login provider',
        data: {
          firstName: 'Maria',
          email: 'maria.garcia@example.com',
          sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=maria-garcia',
          provider: { OTP: true, firstConnect: false },
        },
      },
      {
        name: 'agent-welcome-firstconnect',
        label: 'FirstConnect login provider',
        data: {
          firstName: 'Robert',
          email: 'robert.johnson@firstconnect.com',
          sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=robert-johnson',
          provider: { OTP: false, firstConnect: true },
        },
      },
      {
        name: 'agent-welcome-no-selling',
        label: 'No selling link',
        data: {
          firstName: 'Ana',
          email: 'ana.martinez@example.com',
          sellingLink: '',
          provider: { OTP: true, firstConnect: false },
        },
      },
    ],
  },
  {
    id: 'rejection',
    label: 'Rejection',
    description: 'Application rejection notification',
    provider: 'sendgrid',
    source: 'dist/rejection.html',
    variations: [
      {
        name: 'rejection-default',
        label: 'Default rejection',
        data: {},
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Generate test variations
// ---------------------------------------------------------------------------

mkdirSync('dist/test', { recursive: true });

let totalVariations = 0;

const rows = templates.map((tpl) => {
  const providerInfo = providers[tpl.provider];
  const providerBadge = `<span class="provider-badge" style="background: ${providerInfo.color};">${providerInfo.shortName}</span>`;
  let cards = '';

  if (tpl.variations.length > 0) {
    const html = readFileSync(tpl.source, 'utf-8');
    for (const v of tpl.variations) {
      const result = resolveTemplate(tpl.provider, html, v.data, v.conditions || {});
      writeFileSync(`dist/test/${v.name}.html`, result);
      writeFileSync(`dist/test/${v.name}.txt`, htmlToPlainText(result));
      totalVariations++;

      const metaName =
        v.data.customer_name || v.data.firstName || v.data['contact.firstname'] || '';
      cards += `
        <a class="card" href="${v.name}.html" target="_blank">
          <div class="thumb"><iframe src="${v.name}.html" tabindex="-1" loading="lazy"></iframe></div>
          <div class="info">
            <div class="card-label">${v.label}</div>
            <div class="card-meta">${metaName} &middot; <a href="${v.name}.txt" target="_blank" class="txt-link">plain text</a></div>
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
      <div class="row-header" style="border-left-color: ${providerInfo.color};">
        <h2>${providerBadge} ${tpl.label}</h2>
        <p>${tpl.description}</p>
        <span class="badge">${tpl.variations.length || 1}</span>
      </div>
      <div class="row-cards">
        ${cards}
      </div>
    </div>`;
});

// ---------------------------------------------------------------------------
// Provider legend
// ---------------------------------------------------------------------------

const legendItems = Object.values(providers)
  .map(
    (p) =>
      `<span class="legend-item"><span class="legend-dot" style="background: ${p.color};"></span>${p.name}</span>`
  )
  .join('');

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

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

  .legend { display: flex; gap: 16px; padding: 12px 24px; background: #fff; border-bottom: 1px solid #e0ddd8; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #444; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

  .board { display: flex; flex-direction: column; gap: 24px; padding: 24px; }

  .row { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .row-header {
    padding: 16px 20px 12px; border-left: 4px solid #ccc; position: relative;
    border-bottom: 1px solid #eee;
  }
  .row-header h2 { font-size: 16px; font-weight: 700; color: #002454; display: flex; align-items: center; gap: 8px; }
  .row-header p { font-size: 12px; color: #888; margin-top: 2px; }
  .badge {
    position: absolute; top: 16px; right: 20px;
    background: #f0ede8; font-size: 11px; font-weight: 700; color: #666;
    width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .provider-badge {
    font-size: 9px; font-weight: 700; color: #fff; padding: 2px 6px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.5px;
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
<div class="legend">${legendItems}</div>
<div class="board">
  ${rows.join('\n')}
</div>
</body></html>`;

writeFileSync('dist/test/index.html', index);
console.log(`Generated ${totalVariations} previews across ${templates.length} templates in dist/test/`);
