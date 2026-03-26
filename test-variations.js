import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { providers, resolveTemplate } from './providers.js';
import { htmlToPlainText } from './html-to-text.js';

// ---------------------------------------------------------------------------
// All email templates, grouped by provider
// ---------------------------------------------------------------------------

// Shared test data blocks
const petShortData = {
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

const rentersShortData = {
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

// Each variation generates one preview per language in sources.
// Output files: {variation.name}-{lang}.html
const templates = [
  // ======================== Customer / CI ========================
  {
    id: 'client-welcome',
    label: 'Client Welcome',
    description: 'Policy template — auto-sent on policy creation',
    audience: 'customer',
    provider: 'ci',
    sources: {
      en: 'dist/client-welcome.ci.en.html',
      es: 'dist/client-welcome.ci.es.html',
    },
    variations: [
      { name: 'pet-short', label: 'Pet — Short names', data: petShortData, conditions: petConditions },
      { name: 'pet-long', label: 'Pet — Long names', data: petLongData, conditions: petConditions },
      { name: 'renters-short', label: 'Renters — Short names', data: rentersShortData, conditions: rentersConditions },
      { name: 'renters-long', label: 'Renters — Long names', data: rentersLongData, conditions: rentersConditions },
    ],
  },
  {
    id: 'general',
    label: 'General',
    description: 'On-demand generic email from CI handler',
    audience: 'customer',
    provider: 'ci',
    sources: {
      en: 'dist/general.ci.en.html',
      es: 'dist/general.ci.es.html',
    },
    variations: [
      {
        name: 'general',
        label: 'Default message',
        data: {
          email_subject: 'Important Update About Your Policy',
          email_body: 'Dear Zelda,<br/><br/>We wanted to let you know about an important update to your Kanguro policy. Please review the details in your customer portal or contact us if you have any questions.<br/><br/>Best regards,<br/>The Kanguro Team',
        },
        conditions: {},
      },
    ],
  },

  // ======================== Customer / SendGrid ========================
  {
    id: 'welcome-tmp',
    label: 'Welcome (tmp)',
    description: 'Simplified welcome — app download focus, no policy card',
    audience: 'customer',
    provider: 'sendgrid',
    sources: {
      en: 'dist/welcome-tmp.sg.en.html',
      es: 'dist/welcome-tmp.sg.es.html',
    },
    variations: [
      { name: 'welcome-tmp', label: 'Default', data: { firstName: 'Zelda' } },
    ],
  },

  // ======================== Agent / SendGrid ========================
  {
    id: 'otp',
    label: 'OTP',
    description: 'One-time password for agency portal login',
    audience: 'agent',
    provider: 'sendgrid',
    sources: {
      en: 'dist/otp.sg.en.html',
      es: 'dist/otp.sg.es.html',
    },
    variations: [
      { name: 'otp', label: 'Default OTP', data: { otpCode: '847293' } },
    ],
  },
  {
    id: 'agent-welcome',
    label: 'Agent Welcome',
    description: 'Welcome email for new agents with portal access',
    audience: 'agent',
    provider: 'sendgrid',
    sources: {
      en: 'dist/agent-welcome.sg.en.html',
      es: 'dist/agent-welcome.sg.es.html',
    },
    variations: [
      {
        name: 'agent-welcome-otp',
        label: 'OTP login',
        data: {
          firstName: 'Maria',
          email: 'maria.garcia@example.com',
          sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=maria-garcia',
          provider: { OTP: true, firstConnect: false },
        },
      },
      {
        name: 'agent-welcome-firstconnect',
        label: 'FirstConnect login',
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
    audience: 'agent',
    provider: 'sendgrid',
    sources: {
      en: 'dist/rejection.sg.en.html',
    },
    variations: [
      { name: 'rejection', label: 'Default rejection', data: {} },
    ],
  },
];

// ---------------------------------------------------------------------------
// Generate test variations
// ---------------------------------------------------------------------------

mkdirSync('dist/test', { recursive: true });

let totalVariations = 0;

// Escape HTML for embedding plain text in the page
function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Group templates by audience/provider (matching folder structure)
const groups = {};
for (const tpl of templates) {
  const key = `${tpl.audience}/${tpl.provider}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(tpl);
}

const audienceLabels = { customer: 'Customer', agent: 'Agent' };

function buildCards(tpl) {
  const langs = Object.keys(tpl.sources);
  const hasEs = langs.includes('es');
  let cards = '';

  for (const v of tpl.variations) {
    for (const lang of langs) {
      const source = tpl.sources[lang];
      const html = readFileSync(source, 'utf-8');
      const result = resolveTemplate(tpl.provider, html, v.data, v.conditions || {});
      const plainText = htmlToPlainText(result);
      const fileName = langs.length > 1 ? `${v.name}-${lang}` : v.name;
      writeFileSync(`dist/test/${fileName}.html`, result);
      writeFileSync(`dist/test/${fileName}.txt`, plainText);
      totalVariations++;

      // EN-only templates get data-fallback so they show (highlighted) when ES is selected
      const isFallback = lang === 'en' && !hasEs;

      cards += `
        <div class="card" data-lang="${lang}"${isFallback ? ' data-fallback' : ''}>
          <div class="card-tabs">
            <button class="tab active" data-tab="html">HTML</button>
            <button class="tab" data-tab="txt">Plain Text</button>
            <a class="card-open" href="${fileName}.html" target="_blank" title="Open in new tab">&#x2197;</a>
          </div>
          <div class="card-body tab-html active">
            <iframe src="${fileName}.html" tabindex="-1" loading="lazy"></iframe>
          </div>
          <div class="card-body tab-txt">
            <pre>${esc(plainText)}</pre>
          </div>
          <div class="card-footer">
            <span class="card-label">${v.label}</span>
            ${isFallback ? '<span class="fallback-badge">EN only</span>' : ''}
          </div>
        </div>`;
    }
  }
  return cards;
}

// Build sections
const sections = Object.entries(groups).map(([groupKey, tpls]) => {
  const [audience, provider] = groupKey.split('/');
  const providerInfo = providers[provider];
  const audienceLabel = audienceLabels[audience] || audience;

  const templateRows = tpls.map((tpl) => {
    const cards = buildCards(tpl);
    return `
      <div class="tpl-row">
        <div class="tpl-header">
          <span class="tpl-name">${tpl.label}</span>
          <span class="tpl-desc">${tpl.description}</span>
        </div>
        <div class="tpl-cards">${cards}</div>
      </div>`;
  }).join('');

  return `
    <div class="group">
      <div class="group-header">
        <div class="group-title">
          <span class="audience-label">${audienceLabel}</span>
          <span class="provider-pill" style="background: ${providerInfo.color};">${providerInfo.name}</span>
        </div>
        <span class="group-path">${audience}/${provider}/</span>
      </div>
      ${templateRows}
    </div>`;
}).join('');

// ---------------------------------------------------------------------------
// Index page
// ---------------------------------------------------------------------------

const index = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kanguro Email Templates</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; background: #f0ede8; min-height: 100vh; }

  /* ---- Nav ---- */
  nav { background: #002454; color: #fff; padding: 16px 28px; position: sticky; top: 0; z-index: 10;
        display: flex; align-items: center; justify-content: space-between; }
  .nav-left h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
  .nav-left p { font-size: 11px; opacity: 0.5; margin-top: 1px; }

  /* ---- Language switcher ---- */
  .lang-switch { display: flex; background: rgba(255,255,255,0.12); border-radius: 8px; overflow: hidden; }
  .lang-btn {
    padding: 7px 20px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.45);
    border: none; background: none; cursor: pointer; transition: all 0.15s;
    font-family: inherit; letter-spacing: 0.5px;
  }
  .lang-btn.active { background: #FF8D7B; color: #002454; }
  .lang-btn:hover:not(.active) { color: #fff; }

  /* ---- Board ---- */
  .board { display: flex; flex-direction: column; gap: 28px; padding: 24px; max-width: 1400px; margin: 0 auto; }

  /* ---- Group (audience/provider) ---- */
  .group { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .group-header {
    padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #eee;
  }
  .group-title { display: flex; align-items: center; gap: 10px; }
  .audience-label { font-size: 15px; font-weight: 700; color: #002454; }
  .provider-pill {
    font-size: 10px; font-weight: 700; color: #fff; padding: 3px 10px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .group-path { font-size: 11px; color: #aaa; font-family: 'SF Mono', 'Fira Code', monospace; }

  /* ---- Template row ---- */
  .tpl-row { border-bottom: 1px solid #f5f3f0; }
  .tpl-row:last-child { border-bottom: none; }
  .tpl-header { padding: 14px 24px 0; }
  .tpl-name { font-size: 14px; font-weight: 700; color: #002454; }
  .tpl-desc { font-size: 11px; color: #999; margin-left: 8px; }
  .tpl-cards { padding: 10px 18px 16px; display: flex; gap: 14px; overflow-x: auto; }

  /* ---- Card ---- */
  .card {
    flex: 0 0 260px; background: #faf9f7; border-radius: 10px; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    border: 1.5px solid #eee; display: flex; flex-direction: column;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
  .card.hidden { display: none; }
  .card.fallback { border-color: #E67E22; }

  /* ---- Card tabs ---- */
  .card-tabs {
    display: flex; align-items: center; background: #f5f3f0; border-bottom: 1px solid #eee;
    padding: 0 4px; height: 30px;
  }
  .card-tabs .tab {
    font-family: inherit; font-size: 10px; font-weight: 600; color: #999;
    padding: 4px 10px; border: none; background: none; cursor: pointer;
    border-radius: 5px; margin: 3px 1px; transition: all 0.12s; letter-spacing: 0.2px;
  }
  .card-tabs .tab.active { background: #fff; color: #002454; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
  .card-tabs .tab:hover:not(.active) { color: #666; }
  .card-open {
    margin-left: auto; font-size: 12px; color: #bbb; text-decoration: none;
    padding: 2px 6px; border-radius: 4px; transition: all 0.12s; line-height: 1;
  }
  .card-open:hover { color: #002454; background: #fff; }

  /* ---- Card body ---- */
  .card-body { display: none; }
  .card-body.active { display: block; }
  .card-body.tab-html { height: 180px; overflow: hidden; background: #fff; }
  .card-body.tab-html iframe {
    width: 200%; height: 200%; transform: scale(0.5); transform-origin: top left;
    pointer-events: none; border: 0;
  }
  .card-body.tab-txt {
    height: 180px; overflow: auto; background: #1e1e2e; padding: 10px;
  }
  .card-body.tab-txt pre {
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 10px; line-height: 1.5; color: #cdd6f4; white-space: pre-wrap;
    word-break: break-word; margin: 0;
  }

  /* ---- Card footer ---- */
  .card-footer {
    padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid #eee; min-height: 34px;
  }
  .card-label { font-size: 11px; font-weight: 600; color: #002454; }
  .fallback-badge {
    font-size: 9px; font-weight: 700; color: #E67E22; background: #FEF3E8;
    padding: 2px 7px; border-radius: 4px; letter-spacing: 0.3px;
  }
</style>
</head><body>
<nav>
  <div class="nav-left">
    <h1>Kanguro Email Templates</h1>
    <p>${templates.length} templates &middot; ${totalVariations} previews</p>
  </div>
  <div class="lang-switch">
    <button class="lang-btn active" data-filter="en">EN</button>
    <button class="lang-btn" data-filter="es">ES</button>
  </div>
</nav>
<div class="board">
  ${sections}
</div>
<script>
  // Language filter
  document.querySelector('.lang-switch').addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.filter;

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.card[data-lang]').forEach(card => {
      const cardLang = card.dataset.lang;
      const isFallback = card.hasAttribute('data-fallback');

      if (cardLang === lang) {
        card.classList.remove('hidden', 'fallback');
      } else if (isFallback && lang === 'es') {
        // EN-only template shown as fallback when ES is selected
        card.classList.remove('hidden');
        card.classList.add('fallback');
      } else {
        card.classList.add('hidden');
        card.classList.remove('fallback');
      }
    });
  });

  // Apply default filter on load
  document.querySelector('.lang-btn[data-filter="en"]').click();

  // Card HTML/Plain Text tabs
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.card-tabs .tab');
    if (!tab) return;
    const card = tab.closest('.card');
    const target = tab.dataset.tab;

    card.querySelectorAll('.card-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    card.querySelectorAll('.card-body').forEach(b => b.classList.remove('active'));
    card.querySelector('.tab-' + target).classList.add('active');
  });
</script>
</body></html>`;

writeFileSync('dist/test/index.html', index);
console.log(`Generated ${totalVariations} previews across ${templates.length} templates in dist/test/`);
