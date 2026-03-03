/**
 * Email Diagnostic Script
 *
 * Tests Resend email configuration and sends test emails
 *
 * Usage:
 *   npx tsx src/scripts/test-email.ts
 *   npx tsx src/scripts/test-email.ts your-email@example.com
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg: string) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg: string) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg: string) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${COLORS.cyan}${msg}${COLORS.reset}\n${'='.repeat(60)}`),
};

async function runDiagnostics() {
  const testEmail = process.argv[2] || 'test@example.com';

  console.log('\n' + '='.repeat(60));
  console.log('           EMAIL SYSTEM DIAGNOSTICS');
  console.log('='.repeat(60) + '\n');

  // Step 1: Check Environment Variables
  log.section('Step 1: Checking Environment Variables');

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || process.env.RESEND_FROM;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

  if (RESEND_API_KEY) {
    log.success(`RESEND_API_KEY is set (length: ${RESEND_API_KEY.length} characters)`);
    log.info(`   Preview: ${RESEND_API_KEY.substring(0, 10)}...${RESEND_API_KEY.substring(RESEND_API_KEY.length - 4)}`);
  } else {
    log.error('RESEND_API_KEY is NOT set');
    log.error('   Please add RESEND_API_KEY to your .env.local file');
    log.error('   Get your API key from: https://resend.com/api-keys');
    process.exit(1);
  }

  if (EMAIL_FROM) {
    log.success(`EMAIL_FROM is set: ${EMAIL_FROM}`);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(EMAIL_FROM)) {
      log.success('   Email format is valid');
    } else {
      log.warning('   Email format looks invalid');
    }

    // Check if using default
    if (EMAIL_FROM === 'onboarding@resend.dev') {
      log.warning('   You are using the default Resend email');
      log.warning('   For production, verify your own domain at: https://resend.com/domains');
    }
  } else {
    log.warning('EMAIL_FROM is not set');
    log.warning('   Falling back to: onboarding@resend.dev');
  }

  if (NEXTAUTH_URL) {
    log.success(`NEXTAUTH_URL is set: ${NEXTAUTH_URL}`);
  } else {
    log.warning('NEXTAUTH_URL is not set (needed for reset links)');
  }

  // Step 2: Initialize Resend Client
  log.section('Step 2: Initializing Resend Client');

  let resend: Resend;
  try {
    resend = new Resend(RESEND_API_KEY);
    log.success('Resend client initialized successfully');
  } catch (error: any) {
    log.error('Failed to initialize Resend client');
    log.error(`   Error: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Test API Connection
  log.section('Step 3: Testing Resend API Connection');

  try {
    // Try to list domains (this tests if API key is valid)
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    if (domainsResponse.ok) {
      const domains = await domainsResponse.json();
      log.success('Successfully connected to Resend API');
      log.info(`   Found ${domains.data?.length || 0} domain(s) in your account`);

      if (domains.data && domains.data.length > 0) {
        log.info('\n   Configured domains:');
        domains.data.forEach((domain: any, index: number) => {
          const status = domain.status === 'verified'
            ? `${COLORS.green}✓ verified${COLORS.reset}`
            : `${COLORS.yellow}⚠ ${domain.status}${COLORS.reset}`;
          log.info(`   ${index + 1}. ${domain.name} [${status}]`);
        });
      } else {
        log.warning('   No domains configured yet');
        log.warning('   Add a domain at: https://resend.com/domains');
      }
    } else {
      const error = await domainsResponse.json();
      log.error('Failed to connect to Resend API');
      log.error(`   Status: ${domainsResponse.status}`);
      log.error(`   Error: ${JSON.stringify(error, null, 2)}`);

      if (domainsResponse.status === 401) {
        log.error('\n   Your API key appears to be invalid');
        log.error('   Please check your RESEND_API_KEY in .env.local');
      }
    }
  } catch (error: any) {
    log.error('Network error connecting to Resend API');
    log.error(`   Error: ${error.message}`);
  }

  // Step 4: Send Test Email
  log.section('Step 4: Sending Test Email');
  log.info(`Attempting to send test email to: ${testEmail}`);

  const fromAddress = EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: testEmail,
      subject: 'Taja Shop - Email Test',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #10b981; margin-top: 0;">✅ Email Test Successful!</h1>
              <p>Congratulations! Your Resend email configuration is working correctly.</p>
            </div>

            <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Test Details:</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 40%;">From:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${fromAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">To:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${testEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Sent:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${new Date().toISOString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">API Key:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${RESEND_API_KEY?.substring(0, 10)}...</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> If this email arrived in your spam folder, please mark it as "Not Spam" to ensure future emails are delivered to your inbox.</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1f2937; font-size: 16px; margin-top: 0;">Next Steps:</h3>
              <ol style="color: #4b5563; padding-left: 20px;">
                <li>Check your spam/junk folder if you don't see this email in your inbox</li>
                <li>Verify your domain in Resend dashboard for better deliverability</li>
                <li>Set up SPF, DKIM, and DMARC records for your domain</li>
                <li>Test all email functions (verification, password reset, notifications)</li>
              </ol>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">This is a test email from Taja Shop Email Diagnostic System</p>
              <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Taja Tech Innovations Limited</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      log.error('Failed to send test email');
      log.error(`   Error: ${error.message}`);

      if (error.message.includes('Domain not found')) {
        log.error('\n   The FROM email domain is not verified in your Resend account');
        log.error('   Steps to fix:');
        log.error('   1. Go to https://resend.com/domains');
        log.error('   2. Add your domain (e.g., tajaapp.shop)');
        log.error('   3. Add the DNS records provided by Resend');
        log.error('   4. Wait for verification (usually 5-30 minutes)');
        log.error('\n   OR use onboarding@resend.dev for testing');
      }

      console.log('\n   Full error details:', JSON.stringify(error, null, 2));
    } else {
      log.success('Test email sent successfully! 🎉');
      log.info(`   Email ID: ${data?.id}`);
      log.success('\n   Check your inbox (and spam folder) for the test email');
      log.info(`   To: ${testEmail}`);
      log.info(`   From: ${fromAddress}`);

      log.info('\n   Track this email in Resend dashboard:');
      log.info(`   https://resend.com/emails/${data?.id}`);
    }
  } catch (error: any) {
    log.error('Exception while sending test email');
    log.error(`   Error: ${error.message}`);
    console.log('\n   Full error:', error);
  }

  // Step 5: Check Email Templates
  log.section('Step 5: Checking Email Templates');

  const templates = [
    'verification',
    'welcome',
    'password-reset',
    'order-confirmation',
    'order-shipped',
    'admin-kyc',
    'admin-new-shop',
  ];

  const fs = require('fs');
  const path = require('path');

  templates.forEach((template) => {
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${template}.html`);
    try {
      if (fs.existsSync(templatePath)) {
        const stats = fs.statSync(templatePath);
        log.success(`${template}.html exists (${stats.size} bytes)`);
      } else {
        log.error(`${template}.html is missing`);
      }
    } catch (error) {
      log.error(`Error checking ${template}.html`);
    }
  });

  // Step 6: Summary and Recommendations
  log.section('Summary and Recommendations');

  if (RESEND_API_KEY && EMAIL_FROM) {
    log.success('✓ Environment variables are configured');
  } else {
    log.warning('⚠ Some environment variables are missing');
  }

  log.info('\n📋 Checklist for Production:');
  console.log('   [ ] Verify your domain in Resend dashboard');
  console.log('   [ ] Add SPF record: v=spf1 include:_spf.resend.com ~all');
  console.log('   [ ] Add DKIM records provided by Resend');
  console.log('   [ ] Add DMARC record for email authentication');
  console.log('   [ ] Test all email types (verification, reset, orders)');
  console.log('   [ ] Check spam scores at mail-tester.com');
  console.log('   [ ] Monitor email deliverability in Resend dashboard');
  console.log('   [ ] Set up webhook for bounce/complaint tracking');

  log.info('\n🔗 Useful Links:');
  console.log('   - Resend Dashboard: https://resend.com/');
  console.log('   - API Keys: https://resend.com/api-keys');
  console.log('   - Domains: https://resend.com/domains');
  console.log('   - Email Logs: https://resend.com/emails');
  console.log('   - Documentation: https://resend.com/docs');

  log.info('\n💡 Tips for Better Deliverability:');
  console.log('   1. Use your own verified domain (not onboarding@resend.dev)');
  console.log('   2. Warm up your domain by starting with small volumes');
  console.log('   3. Keep your email content HTML-balanced (not too image-heavy)');
  console.log('   4. Include unsubscribe links in marketing emails');
  console.log('   5. Monitor bounce rates and remove invalid emails');
  console.log('   6. Use descriptive subject lines (avoid spam trigger words)');

  console.log('\n' + '='.repeat(60));
  console.log('           DIAGNOSTICS COMPLETE');
  console.log('='.repeat(60) + '\n');
}

// Run diagnostics
runDiagnostics().catch((error) => {
  log.error('Fatal error during diagnostics');
  console.error(error);
  process.exit(1);
});
