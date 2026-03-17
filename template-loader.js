import { readFileSync } from 'fs';
import { join } from 'path';
import { resolveTemplate } from './providers.js';

/**
 * Load an email template from the dist folder and replace variables
 * using the appropriate provider's templating engine.
 *
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {'ci'|'sendgrid'|'hubspot'} provider - Which provider's syntax to use
 * @param {Object} data - Variable values to replace
 * @param {Object} [conditions] - CI conditional flags (only for provider 'ci')
 * @returns {string} - HTML string with variables replaced
 *
 * @example
 * // CI template
 * const html = loadTemplate('client-welcome', 'ci', {
 *   customer_firstname: 'Zelda',
 *   customer_name: 'Zelda Abarquez',
 * }, { recipient_is_customer: true, policy_product_has_pet: true });
 *
 * @example
 * // SendGrid template
 * const html = loadTemplate('otp', 'sendgrid', { otpCode: '123456' });
 *
 * @example
 * // HubSpot template
 * const html = loadTemplate('welcome', 'hubspot', {
 *   'contact.firstname': 'Sofia',
 * });
 */
export function loadTemplate(templateName, provider, data = {}, conditions = {}) {
  const templatePath = join(process.cwd(), 'dist', `${templateName}.html`);
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
};

// Usage examples:
if (import.meta.main) {
  console.log('=== OTP Email (SendGrid) ===');
  const otpEmail = loadTemplate('otp', 'sendgrid', { otpCode: '987654' });
  console.log(otpEmail.substring(0, 500) + '...\n');

  console.log('=== Agent Welcome Email (SendGrid) ===');
  const welcomeEmail = loadTemplate('agent-welcome', 'sendgrid', {
    firstName: 'Maria',
    email: 'maria.garcia@example.com',
    sellingLink: 'https://kanguroinsurance.com/get-a-quote?agent=maria',
    provider: { OTP: true, firstConnect: false },
  });
  console.log(welcomeEmail.substring(0, 500) + '...\n');

  console.log('=== General Email (CI) ===');
  const generalEmail = loadTemplate('general', 'ci', {
    email_subject: 'Test Subject',
    email_body: 'Test body content',
  });
  console.log(generalEmail.substring(0, 500) + '...\n');
}
