import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { providers, resolveTemplate } from './providers.js';
import { htmlToPlainText } from './html-to-text.js';

// ---------------------------------------------------------------------------
// All email templates, grouped by provider
// ---------------------------------------------------------------------------

// Shared test data blocks
const petDogData = {
  customer_firstname: 'Zelda',
  customer_name: 'Zelda Abarquez',
  prefixed_customer_id: 'KS10005813',
  prefixed_policy_id: '20033288',
  policy_startdate: '12/19/2025',
  policy_enddate: '12/18/2026',
  policy_product_name: 'Kanguro Pet Insurance',
  policy_product_name_short: 'Kanguro Pet',
  pet_single_name: 'Louis',
};

const petCatData = {
  customer_firstname: 'James',
  customer_name: 'James Wilson',
  prefixed_customer_id: 'KS10009102',
  prefixed_policy_id: '20051847',
  policy_startdate: '02/01/2026',
  policy_enddate: '01/31/2027',
  policy_product_name: 'Kanguro Pet Insurance',
  policy_product_name_short: 'Kanguro Pet',
  pet_single_name: 'Whiskers',
};

const petLongData = {
  customer_firstname: 'Alejandro',
  customer_name: 'Alejandro Fernández de la Cruz',
  prefixed_customer_id: 'KS10012847',
  prefixed_policy_id: '20078934',
  policy_startdate: '06/15/2026',
  policy_enddate: '06/14/2027',
  policy_product_name: 'Kanguro Pet Insurance',
  policy_product_name_short: 'Kanguro Pet',
  pet_single_name: 'Sir Barksalot McFluffington',
};

const rentersFLData = {
  customer_firstname: 'Maria',
  customer_name: 'Maria González',
  prefixed_customer_id: 'KS10007421',
  prefixed_policy_id: '20045612',
  policy_startdate: '01/15/2026',
  policy_enddate: '01/14/2027',
  policy_product_name: 'Kanguro Renter Insurance Florida',
  policy_product_name_short: 'Kanguro Renter FL',
  pet_single_name: '',
};

const rentersTXData = {
  customer_firstname: 'Carlos',
  customer_name: 'Carlos Rivera',
  prefixed_customer_id: 'KS10011235',
  prefixed_policy_id: '20062390',
  policy_startdate: '03/01/2026',
  policy_enddate: '02/28/2027',
  policy_product_name: 'Kanguro Renter Insurance Texas',
  policy_product_name_short: 'Kanguro Renter TX',
  pet_single_name: '',
};

const rentersLongData = {
  customer_firstname: 'Christopher',
  customer_name: 'Christopher Williamson-Montgomery',
  prefixed_customer_id: 'KS10015678',
  prefixed_policy_id: '20091256',
  policy_startdate: '04/01/2026',
  policy_enddate: '03/31/2027',
  policy_product_name: 'Kanguro Renter Insurance Georgia',
  policy_product_name_short: 'Kanguro Renter GA',
  pet_single_name: '',
};

const petConditions = { recipient_is_customer: true, policy_product_has_pet: true };
const rentersConditions = { recipient_is_customer: true, policy_product_has_pet: false };

const templates = [
  // ======================== CI (CloudInsurance) ========================
  {
    id: 'client-welcome',
    label: 'Client Welcome',
    description: 'Policy template — auto-sent on policy creation',
    provider: 'ci',
    sources: {
      en: 'dist/client-welcome.ci.en.html',
      es: 'dist/client-welcome.ci.es.html',
    },
    variations: [
      { name: 'pet-dog-en', label: 'Pet — Dog (Louis) [EN]', lang: 'en', data: petDogData, conditions: petConditions },
      { name: 'pet-dog-es', label: 'Pet — Dog (Louis) [ES]', lang: 'es', data: petDogData, conditions: petConditions },
      { name: 'pet-cat-en', label: 'Pet — Cat (Whiskers) [EN]', lang: 'en', data: petCatData, conditions: petConditions },
      { name: 'pet-long-en', label: 'Pet — Long names [EN]', lang: 'en', data: petLongData, conditions: petConditions },
      { name: 'renters-fl-en', label: 'Renters — Florida [EN]', lang: 'en', data: rentersFLData, conditions: rentersConditions },
      { name: 'renters-fl-es', label: 'Renters — Florida [ES]', lang: 'es', data: rentersFLData, conditions: rentersConditions },
      { name: 'renters-tx-en', label: 'Renters — Texas [EN]', lang: 'en', data: rentersTXData, conditions: rentersConditions },
      { name: 'renters-long-en', label: 'Renters — Long names (GA) [EN]', lang: 'en', data: rentersLongData, conditions: rentersConditions },
    ],
  },
  {
    id: 'general',
    label: 'General',
    description: 'On-demand generic email from CI handler',
    provider: 'ci',
    sources: {
      en: 'dist/general.ci.en.html',
      es: 'dist/general.ci.es.html',
    },
    variations: [
      {
        name: 'general-en',
        label: 'Default message [EN]',
        lang: 'en',
        data: {
          email_subject: 'Important Update About Your Policy',
          email_body: 'Dear Zelda,<br/><br/>We wanted to let you know about an important update to your Kanguro policy. Please review the details in your customer portal or contact us if you have any questions.<br/><br/>Best regards,<br/>The Kanguro Team',
        },
        conditions: {},
      },
      {
        name: 'general-es',
        label: 'Default message [ES]',
        lang: 'es',
        data: {
          email_subject: 'Actualización Importante Sobre Tu Póliza',
          email_body: 'Estimada Zelda,<br/><br/>Queríamos informarte sobre una actualización importante en tu póliza de Kanguro. Revisa los detalles en tu portal de cliente o contáctanos si tienes alguna pregunta.<br/><br/>Saludos cordiales,<br/>El Equipo de Kanguro',
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
    sources: {
      en: 'dist/otp.sg.en.html',
      es: 'dist/otp.sg.es.html',
    },
    variations: [
      { name: 'otp-en', label: 'Default OTP [EN]', lang: 'en', data: { otpCode: '847293' } },
      { name: 'otp-es', label: 'Default OTP [ES]', lang: 'es', data: { otpCode: '847293' } },
    ],
  },
  {
    id: 'agent-welcome',
    label: 'Agent Welcome',
    description: 'Welcome email for new agents with portal access',
    provider: 'sendgrid',
    sources: {
      en: 'dist/agent-welcome.sg.en.html',
      es: 'dist/agent-welcome.sg.es.html',
    },
    variations: [
      {
        name: 'agent-welcome-otp-en',
        label: 'OTP login [EN]',
        lang: 'en',
        data: {
          firstName: 'Maria',
          email: 'maria.garcia@example.com',
          sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=maria-garcia',
          provider: { OTP: true, firstConnect: false },
        },
      },
      {
        name: 'agent-welcome-otp-es',
        label: 'OTP login [ES]',
        lang: 'es',
        data: {
          firstName: 'Maria',
          email: 'maria.garcia@example.com',
          sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=maria-garcia',
          provider: { OTP: true, firstConnect: false },
        },
      },
      {
        name: 'agent-welcome-firstconnect-en',
        label: 'FirstConnect login [EN]',
        lang: 'en',
        data: {
          firstName: 'Robert',
          email: 'robert.johnson@firstconnect.com',
          sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=robert-johnson',
          provider: { OTP: false, firstConnect: true },
        },
      },
      {
        name: 'agent-welcome-no-selling-en',
        label: 'No selling link [EN]',
        lang: 'en',
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
    id: 'client-welcome-sg',
    label: 'Client Welcome (SendGrid)',
    description: 'Simplified welcome — app download focus, no policy card',
    provider: 'sendgrid',
    sources: {
      en: 'dist/client-welcome.sg.en.html',
      es: 'dist/client-welcome.sg.es.html',
    },
    variations: [
      { name: 'client-welcome-sg-en', label: 'Default [EN]', lang: 'en', data: { firstName: 'Zelda' } },
      { name: 'client-welcome-sg-es', label: 'Default [ES]', lang: 'es', data: { firstName: 'Zelda' } },
    ],
  },
  {
    id: 'rejection',
    label: 'Rejection',
    description: 'Application rejection notification',
    provider: 'sendgrid',
    sources: {
      en: 'dist/rejection.sg.en.html',
    },
    variations: [
      { name: 'rejection-en', label: 'Default rejection [EN]', lang: 'en', data: {} },
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

  for (const v of tpl.variations) {
    const source = tpl.sources[v.lang || 'en'];
    if (!source) {
      console.warn(`  [SKIP] ${v.name}: no source for lang "${v.lang}"`);
      continue;
    }
    const html = readFileSync(source, 'utf-8');
    const result = resolveTemplate(tpl.provider, html, v.data, v.conditions || {});
    writeFileSync(`dist/test/${v.name}.html`, result);
    writeFileSync(`dist/test/${v.name}.txt`, htmlToPlainText(result));
    totalVariations++;

    const langBadge = v.lang === 'es'
      ? '<span style="background:#E67E22;color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;margin-left:4px;">ES</span>'
      : '<span style="background:#3498DB;color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;margin-left:4px;">EN</span>';

    const metaName =
      v.data.customer_name || v.data.firstName || v.data['contact.firstname'] || '';
    cards += `
      <a class="card" href="${v.name}.html" target="_blank">
        <div class="thumb"><iframe src="${v.name}.html" tabindex="-1" loading="lazy"></iframe></div>
        <div class="info">
          <div class="card-label">${v.label} ${langBadge}</div>
          <div class="card-meta">${metaName} &middot; <a href="${v.name}.txt" target="_blank" class="txt-link">plain text</a></div>
        </div>
      </a>`;
  }

  return `
    <div class="row">
      <div class="row-header" style="border-left-color: ${providerInfo.color};">
        <h2>${providerBadge} ${tpl.label}</h2>
        <p>${tpl.description}</p>
        <span class="badge">${tpl.variations.length}</span>
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
