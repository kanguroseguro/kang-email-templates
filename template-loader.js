import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveTemplate } from './providers.js';

const PROVIDER_SHORT = { ci: 'ci', sendgrid: 'sg', hubspot: 'hs' };

/**
 * Load an email template from the dist folder and replace variables
 * using the appropriate provider's templating engine.
 *
 * @param {string} templateName - Name of the template file (without extension)
 * @param {'ci'|'sendgrid'|'hubspot'} provider - Which provider's syntax to use
 * @param {'en'|'es'} [lang='en'] - Language variant
 * @param {Object} [data={}] - Variable values to replace
 * @param {Object} [conditions={}] - CI conditional flags (only for provider 'ci')
 * @returns {string} - HTML string with variables replaced
 *
 * @example
 * // CI template (English)
 * const html = loadTemplate('client-welcome', 'ci', 'en', {
 *   customer_firstname: 'Zelda',
 *   customer_name: 'Zelda Abarquez',
 * }, { recipient_is_customer: true, policy_product_has_pet: true });
 *
 * @example
 * // SendGrid template (Spanish)
 * const html = loadTemplate('otp', 'sendgrid', 'es', { otpCode: '123456' });
 */
export function loadTemplate(templateName, provider, lang = 'en', data = {}, conditions = {}) {
  const short = PROVIDER_SHORT[provider];
  if (!short) throw new Error(`Unknown provider: ${provider}`);
  const templatePath = join(process.cwd(), 'dist', `${templateName}.${short}.${lang}.html`);
  const html = readFileSync(templatePath, 'utf-8');
  return resolveTemplate(provider, html, data, conditions);
}

/**
 * Template → provider mapping for convenience.
 */
export const templateProviders = {
  'client-welcome': 'ci',
  'general': 'ci',
  'otp': 'sendgrid',
  'agent-welcome': 'sendgrid',
  'rejection': 'sendgrid',
  'client-welcome-sg': 'sendgrid',
};

/**
 * Available languages per template.
 */
export const templateLanguages = {
  'client-welcome': ['en', 'es'],
  'general': ['en', 'es'],
  'otp': ['en', 'es'],
  'agent-welcome': ['en', 'es'],
  'rejection': ['en'],
  'client-welcome-sg': ['en', 'es'],
};

if (import.meta.main) {
  console.log('=== OTP Email (SendGrid, EN) ===');
  const otpEn = loadTemplate('otp', 'sendgrid', 'en', { otpCode: '987654' });
  console.log(otpEn.substring(0, 500) + '...\n');

  console.log('=== OTP Email (SendGrid, ES) ===');
  const otpEs = loadTemplate('otp', 'sendgrid', 'es', { otpCode: '987654' });
  console.log(otpEs.substring(0, 500) + '...\n');

  console.log('=== Client Welcome (SendGrid, EN) ===');
  const cwEn = loadTemplate('client-welcome', 'sendgrid', 'en', { firstName: 'Maria' });
  console.log(cwEn.substring(0, 500) + '...\n');
}
