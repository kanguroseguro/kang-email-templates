/**
 * Email provider definitions — templating languages, test data, and variable resolution.
 *
 * Three providers:
 *   - ci:       CloudInsurance (policy lifecycle emails)
 *   - sendgrid: SendGrid dynamic templates (app-triggered emails via kanguro-backend)
 *   - hubspot:  HubSpot transactional/marketing emails (CRM-triggered)
 */

// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------

export const providers = {
  ci: {
    name: 'CloudInsurance',
    shortName: 'CI',
    color: '#0D6EFD',
    description: 'Policy lifecycle emails auto-sent by CloudInsurance PAS',
    syntax: {
      variable: '[variable_name]',
      conditionalOpen: '[if_condition]',
      conditionalClose: '[/if_condition]',
      negation: '[if_not_condition] … [/if_not_condition]',
    },
  },
  sendgrid: {
    name: 'SendGrid',
    shortName: 'SG',
    color: '#1A82E2',
    description: 'Transactional emails sent from kanguro-backend via SendGrid API',
    syntax: {
      variable: '{{variableName}}',
      conditionalOpen: '{{#if variableName}}',
      conditionalClose: '{{/if}}',
      negation: '{{#unless variableName}} … {{/unless}}',
    },
  },
  hubspot: {
    name: 'HubSpot',
    shortName: 'HS',
    color: '#FF7A59',
    description: 'CRM-triggered transactional and marketing emails via HubSpot',
    syntax: {
      variable: '{{ variable_name }}',
      conditionalOpen: '{% if variable_name %}',
      conditionalClose: '{% endif %}',
      negation: '{% unless variable_name %} … {% endunless %}',
    },
  },
};

// ---------------------------------------------------------------------------
// Test data per provider
// ---------------------------------------------------------------------------

export const testData = {
  ci: {
    // Customer
    customer_firstname: 'Zelda',
    customer_lastname: 'Abarquez',
    customer_name: 'Zelda Abarquez',
    full_name: 'Zelda Abarquez',
    prefixed_customer_id: 'KS10005813',
    partner_name: 'Kanguro',
    partner_sender_name: 'Kanguro Insurance',
    partner_phone: '888 546 5264',
    partner_url: 'https://www.kanguroseguro.com',
    portal_url: 'https://kanguro.cloudinsurance.io/ci/portal',
    // Policy
    policy_id: '20033288',
    prefixed_policy_id: '20033288',
    prefixed_quote_id: '20033288',
    policy_type_name: 'Kanguro Pet Insurance',
    policy_product_name: 'Kanguro Pet Insurance',
    policy_product_name_short: 'Kanguro Pet',
    policy_product_name_public: 'Kanguro Pet Insurance',
    policy_startdate: '12/19/2025',
    policy_enddate: '12/18/2026',
    transaction_amount_tot: '$381.93',
    payment_method: 'Card',
    policy_balance: '$0.00',
    discount_rate: '0 %',
    earliest_auto_cancel_date: '03/26/2026',
    // Claim
    reference_id: '107274',
    prefixed_reference_id: 'UP107274',
    date_received: '07/01/2024',
    incident_date: '06/27/2024',
    claim_incident_description: 'THC toxicity',
    amount_paid: '$415.47',
    amount_transferred: '$415.47',
    pet_single_name: 'Louis',
    // General email
    email_subject: 'Important Update About Your Policy',
    email_body: 'This is a general message from Kanguro Insurance regarding your policy. Please review the details and contact us if you have any questions.',
  },

  sendgrid: {
    // OTP
    otpCode: '847293',
    // Agent welcome
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@example.com',
    sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=maria-garcia',
    provider: {
      OTP: true,
      firstConnect: false,
    },
    // Rejection (no variables currently, but ready for future use)
    applicantFirstName: 'John',
    applicantLastName: 'Smith',
    applicationDate: '03/15/2026',
  },

  hubspot: {
    // HubSpot uses contact properties and deal properties from CRM
    // Variable syntax: {{ contact.property }} or {{ deal.property }}
    'contact.firstname': 'Sofia',
    'contact.lastname': 'Rodriguez',
    'contact.email': 'sofia.rodriguez@example.com',
    'deal.dealname': 'Pet Insurance — Sofia Rodriguez',
    'deal.amount': '381.93',
    'deal.pipeline': 'Pet Insurance',
    'deal.dealstage': 'Closed Won',
    'content.subject': 'Welcome to Kanguro, Sofia!',
    'content.body': 'Thank you for choosing Kanguro Insurance.',
    'subscription_type': 'marketing',
    'unsubscribe_link': '#unsubscribe',
  },
};

// ---------------------------------------------------------------------------
// Variable resolution per provider
// ---------------------------------------------------------------------------

/**
 * Replace CI-style placeholders: [variable_name] → value
 */
export function resolveCIVariables(html, data) {
  let result = html;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`[${key}]`, value);
  }
  return result;
}

/**
 * Resolve CI-style conditionals: [if_x]...[/if_x] and [if_not_x]...[/if_not_x]
 */
export function resolveCIConditionals(html, conditions) {
  let result = html;
  let changed = true;
  while (changed) {
    changed = false;
    const names = new Set();
    for (const m of result.matchAll(/\[if_((?:not_)?[^\]]+)\]/g)) {
      names.add(m[1]);
    }
    for (const name of names) {
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(
        `\\[if_${esc}\\]((?:(?!\\[if_${esc}\\]|\\[/if_${esc}\\])[\\s\\S])*?)\\[/if_${esc}\\]`,
        'g'
      );
      let keep;
      if (name.startsWith('not_')) {
        const positive = name.substring(4);
        keep = positive in conditions ? !conditions[positive] : false;
      } else {
        keep = name in conditions ? conditions[name] : false;
      }
      const next = result.replace(re, (_, content) => (keep ? content : ''));
      if (next !== result) {
        changed = true;
        result = next;
      }
    }
  }
  return result;
}

/**
 * Replace SendGrid Handlebars-style variables: {{variableName}} → value
 * Also resolves {{#if var}}...{{/if}} and {{#unless var}}...{{/unless}}
 * Supports nested objects: {{provider.OTP}} resolves via dot notation
 */
export function resolveSendGridVariables(html, data) {
  let result = html;

  // Resolve {{#if var}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, content) => {
      const val = resolveNestedKey(data, key);
      return val ? content : '';
    }
  );

  // Resolve {{#unless var}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless\s+([\w.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, key, content) => {
      const val = resolveNestedKey(data, key);
      return val ? '' : content;
    }
  );

  // Resolve {{variableName}} simple substitutions
  result = result.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
    const val = resolveNestedKey(data, key);
    return val !== undefined ? String(val) : match;
  });

  return result;
}

/**
 * Replace HubSpot HubL-style variables: {{ variable_name }} → value
 * Also resolves {% if var %}...{% endif %} and {% unless var %}...{% endunless %}
 */
export function resolveHubSpotVariables(html, data) {
  let result = html;

  // Resolve {% if var %}...{% endif %} blocks
  result = result.replace(
    /\{%\s*if\s+([\w.]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
    (_, key, content) => {
      const val = resolveNestedKey(data, key);
      return val ? content : '';
    }
  );

  // Resolve {% unless var %}...{% endunless %} blocks
  result = result.replace(
    /\{%\s*unless\s+([\w.]+)\s*%\}([\s\S]*?)\{%\s*endunless\s*%\}/g,
    (_, key, content) => {
      const val = resolveNestedKey(data, key);
      return val ? '' : content;
    }
  );

  // Resolve {{ variable_name }} simple substitutions
  result = result.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    const val = resolveNestedKey(data, key);
    return val !== undefined ? String(val) : match;
  });

  return result;
}

/**
 * Resolve a dot-notated key against an object.
 * e.g. resolveNestedKey({provider: {OTP: true}}, 'provider.OTP') → true
 */
function resolveNestedKey(obj, key) {
  // First try direct key (for HubSpot-style "contact.firstname" stored flat)
  if (key in obj) return obj[key];
  // Then try nested resolution
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

/**
 * Resolve all variables for a given provider.
 * @param {string} providerKey - 'ci' | 'sendgrid' | 'hubspot'
 * @param {string} html - The compiled HTML template
 * @param {object} data - Variable values to inject
 * @param {object} [conditions] - CI conditional flags (only used for provider 'ci')
 * @returns {string} HTML with variables resolved
 */
export function resolveTemplate(providerKey, html, data, conditions = {}) {
  switch (providerKey) {
    case 'ci': {
      let result = resolveCIConditionals(html, conditions);
      result = resolveCIVariables(result, data);
      return result;
    }
    case 'sendgrid':
      return resolveSendGridVariables(html, data);
    case 'hubspot':
      return resolveHubSpotVariables(html, data);
    default:
      throw new Error(`Unknown provider: ${providerKey}`);
  }
}
