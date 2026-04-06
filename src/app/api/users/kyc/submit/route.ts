import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authenticate } from '@/lib/middleware';
import { verifyIdentity } from '@/lib/identityVerification';
import { sendAdminKycSubmittedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/users/kyc/submit - Submit KYC information (onboarding/kyc page)
// Allow any authenticated user so KYC can be completed during onboarding even before role is refreshed in token
export async function POST(request: NextRequest) {
  const { user, error } = await authenticate(request);

  if (!user) {
    const code = error === 'Unauthorized: invalid token' ? 'INVALID_TOKEN' : 'AUTH_REQUIRED';
    const message =
      code === 'INVALID_TOKEN'
        ? 'Access token is invalid or expired'
        : 'Authentication required';
    return NextResponse.json(
      { ok: false, code, message },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      businessName,
      businessType,
      businessRegistrationNumber,
      idType,
      idNumber,
      bankName,
      accountNumber,
      accountName,
      bankVerificationNumber,
      verifyIdentity: shouldVerify = true, // Option to skip verification for testing
    } = body;

    // Validate required fields
    if (!businessName || !idType || !idNumber || !bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const userDoc = await User.findById(user.userId);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Map frontend idType to verification service (e.g. national_id -> nin for Dojah)
    const idTypeForVerify = (idType === 'national_id' ? 'nin' : idType) as 'nin' | 'passport' | 'voters_card' | 'drivers_license';

    // Verify identity document if enabled
    let verificationResult = null;
    if (shouldVerify && process.env.ENABLE_IDENTITY_VERIFICATION !== 'false') {
      try {
        verificationResult = await verifyIdentity({
          idType: idTypeForVerify,
          idNumber,
          firstName: userDoc.fullName?.split(' ')[0],
          lastName: userDoc.fullName?.split(' ').slice(1).join(' '),
          phoneNumber: userDoc.phone,
        });

        // If verification fails, still allow submission but mark for manual review
        if (!verificationResult.verified) {
          console.warn(`Identity verification failed for user ${user.userId}:`, verificationResult.error);
        }
      } catch (error: any) {
        console.error('Identity verification error:', error);
        // Don't block submission if verification service is down
      }
    }

    // Update KYC information
    userDoc.kyc = {
      ...userDoc.kyc,
      status: 'pending',
      submittedAt: new Date(),
      businessName,
      businessType: businessType || 'individual',
      businessRegistrationNumber: businessRegistrationNumber || undefined,
      idType,
      idNumber,
      bankName,
      accountNumber,
      accountName,
      bankVerificationNumber: bankVerificationNumber || undefined,
      // Store verification result
      identityVerified: verificationResult?.verified || false,
      identityVerificationData: verificationResult?.data || undefined,
      identityVerificationError: verificationResult?.error || undefined,
    };

    await userDoc.save();

    // Notify admin(s) so they can review without checking the DB
    sendAdminKycSubmittedEmail(
      userDoc.fullName || 'Unknown',
      userDoc.email,
      userDoc.phone || undefined,
      businessName
    ).catch((err) => console.error('Admin KYC email failed:', err));

    return NextResponse.json({
      success: true,
      ok: true,
      message: 'KYC information submitted successfully. We will review it shortly.',
      kycStatus: userDoc.kyc.status,
      data: {
        status: userDoc.kyc.status,
        submittedAt: userDoc.kyc.submittedAt,
      },
    });
  } catch (error: any) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      { success: false, ok: false, message: error.message || 'Failed to submit KYC information' },
      { status: 500 }
    );
  }
}
