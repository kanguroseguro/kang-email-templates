import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load an email template from the dist folder and replace variables
 *
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {Object} variables - Object containing variable values to replace
 * @returns {string} - HTML string with variables replaced
 *
 * @example
 * const html = loadTemplate('otp', { otpCode: '123456' });
 *
 * @example
 * const html = loadTemplate('agent-welcome', {
 *   firstName: 'John',
 *   email: 'john@example.com'
 * });
 */
export function loadTemplate(templateName, variables = {}) {
  // Load the compiled HTML template
  const templatePath = join(process.cwd(), 'dist', `${templateName}.html`);
  let html = readFileSync(templatePath, 'utf-8');

  // Replace all variables in the format {{variableName}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, variables[key]);
  });

  return html;
}

/**
 * Available templates and their variables:
 *
 * otp.html
 * --------
 * - otpCode: The one-time password code to display
 *
 * agent-welcome.html
 * ------------------
 * - firstName: Agent's first name
 * - email: Agent's email address
 */

// Usage examples:
if (import.meta.main) {
  console.log('=== OTP Email Example ===');
  const otpEmail = loadTemplate('otp', {
    otpCode: '987654'
  });
  console.log(otpEmail.substring(0, 500) + '...\n');

  console.log('=== Agent Welcome Email Example ===');
  const welcomeEmail = loadTemplate('agent-welcome', {
    firstName: 'Maria',
    email: 'maria.garcia@example.com'
  });
  console.log(welcomeEmail.substring(0, 500) + '...\n');
}
