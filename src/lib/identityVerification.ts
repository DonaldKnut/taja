/**
 * Identity Verification Service
 * Integrates with Nigerian identity verification APIs
 * Supports: NIN, Passport, Voter's Card, Driver's License, Phone Number
 */

interface VerificationResult {
  success: boolean;
  verified: boolean;
  /**
   * When true, the provider could not verify automatically and the submission
   * should be queued for admin/manual verification.
   */
  requiresManualVerification?: boolean;
  data?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    photo?: string;
  };
  error?: string;
  provider?: string;
}

interface VerificationOptions {
  idType: 'nin' | 'passport' | 'voters_card' | 'drivers_license';
  idNumber: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

// Dojah base URL: use sandbox for test keys, production for live
const DOJAH_BASE_URL =
  process.env.DOJAH_BASE_URL ||
  (process.env.DOJAH_USE_SANDBOX === 'true' || process.env.DOJAH_USE_SANDBOX === '1'
    ? 'https://sandbox.dojah.io'
    : 'https://api.dojah.io');

function getDojahKeys(): { appId: string; secretKey: string } {
  const appId = process.env.DOJAH_APP_ID || process.env.DOJAH_APP_ID_SANDBOX || '';
  const secretKey =
    process.env.DOJAH_API_KEY ||
    process.env.DOJAH_SECRET_KEY ||
    process.env.DOJAH_SECRET_KEY_SANDBOX ||
    process.env.IDENTITY_VERIFICATION_API_KEY ||
    '';
  return { appId, secretKey };
}

/**
 * Verify NIN (National Identification Number)
 * Uses Dojah API with fallback to manual verification
 * When Dojah fails or is not configured, returns success with manual flag for admin review
 * Test keys: set DOJAH_USE_SANDBOX=true and use sandbox App ID + Secret from Dojah dashboard.
 */
export async function verifyNIN(
  nin: string,
  firstName?: string,
  lastName?: string,
  dateOfBirth?: string
): Promise<VerificationResult & { requiresManualVerification?: boolean }> {
  try {
    // Validate NIN format (11 digits)
    if (!/^\d{11}$/.test(nin)) {
      return {
        success: false,
        verified: false,
        error: 'Invalid NIN format. Must be 11 digits.',
      };
    }

    const { appId, secretKey } = getDojahKeys();

    if (!appId || !secretKey) {
      console.warn(
        '⚠️  NIN Dojah not configured. Set DOJAH_APP_ID and DOJAH_API_KEY (or DOJAH_SECRET_KEY) in .env. Using sandbox? Set DOJAH_USE_SANDBOX=true and use sandbox keys.'
      );
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: {
          fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
        },
        provider: 'manual',
        error: 'Identity verification service not configured. Requires manual verification.',
      };
    }

    // Dojah NIN Lookup: GET with query param. Use sandbox base URL when DOJAH_USE_SANDBOX=true for test keys.
    const url = new URL(`${DOJAH_BASE_URL}/api/v1/kyc/nin`);
    url.searchParams.set('nin', nin);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'AppId': appId,
        'Authorization': secretKey.startsWith('Bearer ') ? secretKey : `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.message || errorData?.error || response.statusText;
      console.warn(
        `Dojah NIN verification failed (${response.status}), falling back to manual verification:`,
        msg,
        '— Using test/sandbox keys? Set DOJAH_USE_SANDBOX=true and use sandbox App ID + Secret from Dojah dashboard.'
      );
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: {
          fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
        },
        provider: 'manual',
        error: msg || 'NIN verification failed. Requires manual verification.',
      };
    }

    const data = await response.json();
    const entity = data.entity || data;
    const first = entity.first_name || entity.firstname || '';
    const middle = entity.middle_name || entity.middlename || '';
    const last = entity.last_name || entity.surname || entity.lastname || '';

    return {
      success: true,
      verified: true,
      requiresManualVerification: false,
      data: {
        firstName: first,
        lastName: last,
        middleName: middle || undefined,
        fullName: [first, middle, last].filter(Boolean).join(' ').trim(),
        dateOfBirth: entity.date_of_birth || entity.birthdate || undefined,
        gender: entity.gender,
        phoneNumber: entity.phone_number || entity.telephoneno || entity.phone,
        email: entity.email,
        address: entity.residence_address_line_1 || entity.address,
        photo: entity.photo,
      },
      provider: 'dojah',
    };
  } catch (error: any) {
    console.error('NIN verification error, falling back to manual verification:', error);
    
    // Fallback to manual verification on error
    return {
      success: true,
      verified: false,
      requiresManualVerification: true,
      data: {
        fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
      },
      provider: 'manual',
      error: error.message || 'Failed to verify NIN. Requires manual verification.',
    };
  }
}

/**
 * Verify International Passport
 */
export async function verifyPassport(
  passportNumber: string,
  firstName?: string,
  lastName?: string
): Promise<VerificationResult> {
  try {
    // Validate passport format (typically 9 characters: 1 letter + 8 digits)
    if (!/^[A-Z]\d{8}$/.test(passportNumber.toUpperCase())) {
      return {
        success: false,
        verified: false,
        error: 'Invalid passport format',
      };
    }

    const { appId, secretKey } = getDojahKeys();
    const apiKey = secretKey;
    
    if (!appId || !apiKey) {
      console.warn('⚠️  DOJAH_APP_ID or DOJAH_API_KEY not configured. Passport will require manual verification.');
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: {
          fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        },
        provider: 'manual',
        error: 'Identity verification service not configured. Requires manual verification.',
      };
    }

    const response = await fetch(`${DOJAH_BASE_URL}/api/v1/kyc/passport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AppId': appId,
        'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        passport_number: passportNumber,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Dojah passport verification failed, falling back to manual verification:', errorData);
      
      // Fallback to manual verification
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: {
          fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        },
        provider: 'manual',
        error: errorData.message || 'Passport verification failed. Requires manual verification.',
      };
    }

    const data = await response.json();
    const entity = data.entity || data;

    return {
      success: true,
      verified: true,
      requiresManualVerification: false,
      data: {
        firstName: entity.first_name || entity.firstName,
        lastName: entity.last_name || entity.lastName,
        fullName: `${entity.first_name || ''} ${entity.last_name || ''}`.trim(),
        dateOfBirth: entity.date_of_birth || entity.dateOfBirth,
        gender: entity.gender,
      },
      provider: 'dojah',
    };
  } catch (error: any) {
    console.error('Passport verification error, falling back to manual verification:', error);
    
    // Fallback to manual verification on error
    return {
      success: true,
      verified: false,
      requiresManualVerification: true,
      data: {
        fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
      },
      provider: 'manual',
      error: error.message || 'Failed to verify passport. Requires manual verification.',
    };
  }
}

/**
 * Verify Voter's Card (VIN – Voter Identification Number)
 * Dojah: GET /api/v1/kyc/vin?vin=...
 */
export async function verifyVotersCard(
  votersCardNumber: string,
  _firstName?: string,
  _lastName?: string
): Promise<VerificationResult> {
  try {
    // VIN format: alphanumeric, e.g. 91F6B1F5BE29535558655586
    if (!/^[A-Z0-9]{8,25}$/i.test(votersCardNumber.trim())) {
      return {
        success: false,
        verified: false,
        error: 'Invalid Voter\'s ID (VIN) format.',
      };
    }

    const { appId, secretKey } = getDojahKeys();

    if (!appId || !secretKey) {
      console.warn('⚠️  DOJAH_APP_ID or DOJAH_API_KEY not configured. Voter\'s card will require manual verification.');
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: { fullName: undefined },
        provider: 'manual',
        error: 'Identity verification service not configured. Requires manual verification.',
      };
    }

    const url = new URL(`${DOJAH_BASE_URL}/api/v1/kyc/vin`);
    url.searchParams.set('vin', votersCardNumber.trim());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'AppId': appId,
        'Authorization': secretKey.startsWith('Bearer ') ? secretKey : `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.message || errorData?.error || response.statusText;
      console.warn('Dojah VIN verification failed, falling back to manual verification:', msg);
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: { fullName: undefined },
        provider: 'manual',
        error: msg || 'Voter\'s ID verification failed. Requires manual verification.',
      };
    }

    const data = await response.json();
    const entity = data.entity || data;
    // Dojah VIN response: full_name, voter_identification_number, gender, date_of_birth, phone, address, etc.
    const fullName = entity.full_name || [entity.first_name, entity.middle_name, entity.last_name].filter(Boolean).join(' ').trim();

    return {
      success: true,
      verified: true,
      requiresManualVerification: false,
      data: {
        fullName: fullName || undefined,
        dateOfBirth: entity.date_of_birth || entity.dateOfBirth || undefined,
        gender: entity.gender,
        phoneNumber: entity.phone || entity.phone_number,
        address: entity.address || entity.residence_address_line_1,
      },
      provider: 'dojah',
    };
  } catch (error: any) {
    console.error('Voter\'s card verification error, falling back to manual verification:', error);
    return {
      success: true,
      verified: false,
      requiresManualVerification: true,
      data: { fullName: undefined },
      provider: 'manual',
      error: error.message || 'Failed to verify voter\'s card. Requires manual verification.',
    };
  }
}

/**
 * Verify Driver's License
 */
export async function verifyDriversLicense(
  licenseNumber: string,
  firstName?: string,
  lastName?: string
): Promise<VerificationResult> {
  try {
    const { appId, secretKey } = getDojahKeys();
    const apiKey = secretKey;
    
    if (!appId || !apiKey) {
      console.warn('⚠️  DOJAH_APP_ID or DOJAH_API_KEY not configured. Driver\'s license will require manual verification.');
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: {
          fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        },
        provider: 'manual',
        error: 'Identity verification service not configured. Requires manual verification.',
      };
    }

    const response = await fetch(`${DOJAH_BASE_URL}/api/v1/kyc/dl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AppId': appId,
        'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        license_number: licenseNumber,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Dojah driver\'s license verification failed, falling back to manual verification:', errorData);
      
      // Fallback to manual verification
      return {
        success: true,
        verified: false,
        requiresManualVerification: true,
        data: {
          fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        },
        provider: 'manual',
        error: errorData.message || 'Driver\'s license verification failed. Requires manual verification.',
      };
    }

    const data = await response.json();
    const entity = data.entity || data;

    return {
      success: true,
      verified: true,
      requiresManualVerification: false,
      data: {
        firstName: entity.first_name || entity.firstName,
        lastName: entity.last_name || entity.lastName,
        fullName: `${entity.first_name || ''} ${entity.last_name || ''}`.trim(),
        dateOfBirth: entity.date_of_birth || entity.dateOfBirth,
        gender: entity.gender,
      },
      provider: 'dojah',
    };
  } catch (error: any) {
    console.error('Driver\'s license verification error, falling back to manual verification:', error);
    
    // Fallback to manual verification on error
    return {
      success: true,
      verified: false,
      requiresManualVerification: true,
      data: {
        fullName: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
      },
      provider: 'manual',
      error: error.message || 'Failed to verify driver\'s license. Requires manual verification.',
    };
  }
}

/**
 * Verify Phone Number (DISABLED - Phone verification removed to avoid SMS costs)
 * This function is kept for backward compatibility but always returns success
 * Phone verification requires SMS service which costs money
 */
export async function verifyPhoneNumber(
  phoneNumber: string,
  nin?: string
): Promise<VerificationResult> {
  // Phone verification is disabled to avoid SMS costs
  // Phone numbers are still collected but not verified via SMS
  console.warn('Phone verification is disabled to avoid SMS costs');
  
  // Validate Nigerian phone number format only
  const cleaned = phoneNumber.replace(/[^0-9]/g, '');
  if (!/^(0|234)?[789][0-9]{9}$/.test(cleaned)) {
    return {
      success: false,
      verified: false,
      error: 'Invalid Nigerian phone number format',
    };
  }

  // Return success without actual verification
  return {
    success: true,
    verified: false, // Marked as not verified since we're not actually verifying
    data: {
      phoneNumber: phoneNumber,
    },
    provider: 'disabled',
  };
}

// Frontend/form often sends "national_id" for NIN; Dojah expects "nin"
const ID_TYPE_MAP: Record<string, VerificationOptions['idType']> = {
  national_id: 'nin',
  nin: 'nin',
  passport: 'passport',
  voters_card: 'voters_card',
  drivers_license: 'drivers_license',
};

/**
 * Main verification function that routes to appropriate verification method
 */
export async function verifyIdentity(options: VerificationOptions): Promise<VerificationResult> {
  let { idType, idNumber, firstName, lastName, dateOfBirth, phoneNumber } = options;
  idType = ID_TYPE_MAP[idType] ?? idType;

  switch (idType) {
    case 'nin':
      return verifyNIN(idNumber, firstName, lastName, dateOfBirth);
    case 'passport':
      return verifyPassport(idNumber, firstName, lastName);
    case 'voters_card':
      return verifyVotersCard(idNumber, firstName, lastName);
    case 'drivers_license':
      return verifyDriversLicense(idNumber, firstName, lastName);
    default:
      return {
        success: false,
        verified: false,
        error: 'Unsupported ID type',
      };
  }
}






