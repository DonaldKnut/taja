/**
 * Environment URL Verification Script
 *
 * Verifies that all URL environment variables are correctly formatted
 * with proper protocols (http:// or https://)
 *
 * Usage:
 *   npx tsx src/scripts/verify-env-urls.ts
 */

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
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg: string) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg: string) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg: string) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${COLORS.cyan}${msg}${COLORS.reset}\n${'='.repeat(60)}`),
};

interface UrlCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  expectedProtocol?: 'http' | 'https' | 'either';
  description: string;
}

function validateUrl(url: string | undefined, expectedProtocol?: 'http' | 'https' | 'either'): {
  valid: boolean;
  issues: string[];
  corrected?: string;
} {
  const issues: string[] = [];

  if (!url) {
    return { valid: false, issues: ['URL is not set'] };
  }

  // Check if URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    issues.push('Missing protocol (http:// or https://)');

    // Try to determine correct protocol
    const corrected = url.includes('localhost') || url.includes('127.0.0.1')
      ? `http://${url}`
      : `https://${url}`;

    return { valid: false, issues, corrected };
  }

  // Check protocol matches expected
  if (expectedProtocol && expectedProtocol !== 'either') {
    if (expectedProtocol === 'https' && url.startsWith('http://') && !url.includes('localhost')) {
      issues.push('Should use https:// for production domains');
      return { valid: false, issues, corrected: url.replace('http://', 'https://') };
    }
    if (expectedProtocol === 'http' && url.startsWith('https://')) {
      issues.push('Should use http:// for localhost');
      return { valid: false, issues, corrected: url.replace('https://', 'http://') };
    }
  }

  // Check for common mistakes
  if (url.includes('//localhost') && !url.startsWith('http://')) {
    issues.push('localhost should use http://');
    return { valid: false, issues, corrected: url.replace('https://', 'http://') };
  }

  return { valid: true, issues: [] };
}

function checkEnvironmentUrls() {
  console.log('\n' + '='.repeat(60));
  console.log('          ENVIRONMENT URL VERIFICATION');
  console.log('='.repeat(60) + '\n');

  const nodeEnv = process.env.NODE_ENV || 'development';
  log.info(`Current NODE_ENV: ${nodeEnv}`);

  const urlsToCheck: UrlCheck[] = [
    {
      name: 'NEXTAUTH_URL',
      value: process.env.NEXTAUTH_URL,
      required: true,
      expectedProtocol: nodeEnv === 'production' ? 'https' : 'either',
      description: 'Base URL for authentication and email links',
    },
    {
      name: 'FRONTEND_URL',
      value: process.env.FRONTEND_URL,
      required: false,
      expectedProtocol: 'either',
      description: 'Frontend application URL (optional fallback)',
    },
    {
      name: 'LOGO_URL',
      value: process.env.LOGO_URL,
      required: false,
      expectedProtocol: 'https',
      description: 'Logo URL for emails',
    },
  ];

  log.section('Checking URL Environment Variables');

  let hasErrors = false;
  let hasWarnings = false;
  const fixes: { name: string; current: string; suggested: string }[] = [];

  urlsToCheck.forEach((check) => {
    console.log(`\nChecking: ${COLORS.cyan}${check.name}${COLORS.reset}`);
    log.info(`Description: ${check.description}`);

    if (!check.value) {
      if (check.required) {
        log.error(`${check.name} is not set (REQUIRED)`);
        hasErrors = true;
      } else {
        log.warning(`${check.name} is not set (optional)`);
        hasWarnings = true;
      }
      return;
    }

    log.info(`Current value: ${check.value}`);

    const validation = validateUrl(check.value, check.expectedProtocol);

    if (validation.valid) {
      log.success('URL is correctly formatted');
    } else {
      hasErrors = true;
      validation.issues.forEach((issue) => {
        log.error(issue);
      });

      if (validation.corrected) {
        log.warning(`Suggested fix: ${validation.corrected}`);
        fixes.push({
          name: check.name,
          current: check.value,
          suggested: validation.corrected,
        });
      }
    }
  });

  // Summary
  log.section('Summary');

  if (!hasErrors && !hasWarnings) {
    log.success('All environment URLs are correctly configured! 🎉');
  } else if (!hasErrors && hasWarnings) {
    log.warning('All required URLs are correct, but some optional ones are missing.');
  } else {
    log.error('Some URLs need to be fixed!');
  }

  // Show fixes if needed
  if (fixes.length > 0) {
    log.section('Required Fixes');

    console.log('\n📝 Update your .env.local file with these corrections:\n');

    fixes.forEach((fix) => {
      console.log(`${COLORS.red}# Old (incorrect):${COLORS.reset}`);
      console.log(`${fix.name}=${fix.current}`);
      console.log(`${COLORS.green}# New (corrected):${COLORS.reset}`);
      console.log(`${fix.name}=${fix.suggested}`);
      console.log('');
    });

    log.section('Vercel Production Settings');
    console.log('\n⚠️  For production, ensure these are set in Vercel:\n');
    console.log(`${COLORS.green}NEXTAUTH_URL=https://tajaapp.shop${COLORS.reset}`);
    console.log(`${COLORS.green}LOGO_URL=https://res.cloudinary.com/...${COLORS.reset}`);
    console.log('');
    console.log('Go to: https://vercel.com/[project]/settings/environment-variables');
    console.log('');
  }

  // Examples
  log.section('Examples of Correct URLs');
  console.log(`
${COLORS.green}✓ Development:${COLORS.reset}
  NEXTAUTH_URL=http://localhost:3000

${COLORS.green}✓ Production:${COLORS.reset}
  NEXTAUTH_URL=https://tajaapp.shop

${COLORS.red}✗ Incorrect:${COLORS.reset}
  NEXTAUTH_URL=localhost:3000          (missing protocol)
  NEXTAUTH_URL=tajaapp.shop            (missing protocol)
  NEXTAUTH_URL=https://localhost:3000  (wrong protocol for localhost)
  `);

  // Exit code
  console.log('='.repeat(60) + '\n');
  if (hasErrors) {
    process.exit(1);
  }
}

// Run the check
checkEnvironmentUrls();
