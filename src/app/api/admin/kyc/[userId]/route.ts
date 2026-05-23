import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';
import { createNotification } from '@/lib/notifications';
import { sendSellerApprovedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// PUT /api/admin/kyc/[userId] - Approve or reject KYC
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return requireRole(['admin'])(async (req, adminUser) => {
    try {
      const { action, rejectionReason } = await request.json();

      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
          { status: 400 }
        );
      }

      if (action === 'reject' && !rejectionReason) {
        return NextResponse.json(
          { success: false, message: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      await connectDB();

      const user = await User.findById(params.userId);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      if (!user.kyc) {
        return NextResponse.json(
          { success: false, message: 'User has no KYC submission' },
          { status: 400 }
        );
      }

      // Update KYC status
      user.kyc.status = action === 'approve' ? 'approved' : 'rejected';
      user.kyc.reviewedAt = new Date();
      user.kyc.reviewedBy = adminUser.userId;
      
      if (action === 'reject') {
        user.kyc.rejectionReason = rejectionReason;
      }

      // On approval, promote to seller (if not admin) so they can access /seller,
      // and mark role selection complete.
      if (action === 'approve' && user.role !== 'admin') {
        user.role = 'seller';
        (user as any).roleSelected = true;
      }

      await user.save();

      let updatedShops: Array<{ id: string; status: string; verificationStatus: string }> = [];

      if (action === 'approve') {
        // Automatically verify and activate all shops owned by this user so
        // their seller dashboard immediately reflects a verified shop state.
        const shops = await Shop.find({ owner: user._id });
        for (const shop of shops) {
          shop.status = 'active';
          (shop.verification as any) = shop.verification || {} as any;
          (shop.verification as any).status = 'verified';
          (shop.verification as any).verifiedAt = new Date();
          (shop.verification as any).verifiedBy = adminUser.userId;
          await shop.save();

          updatedShops.push({
            id: shop._id.toString(),
            status: shop.status,
            verificationStatus: (shop.verification as any).status,
          });
        }

        // Fire-and-forget: in-app notification
        try {
          await createNotification({
            userId: user._id.toString(),
            type: 'shop',
            title: 'Seller verification approved',
            message: 'You can now publish products and start selling on Taja.Shop.',
            link: '/seller/dashboard',
            actionUrl: '/seller/dashboard',
            priority: 'high',
          });
        } catch (notifyError) {
          console.error('Failed to create seller-approved notification:', notifyError);
        }

        // Fire-and-forget: email to seller (non-blocking for main response)
        try {
          await sendSellerApprovedEmail(
            user.email,
            user.fullName,
            updatedShops[0]?.id ? undefined : undefined
          );
        } catch (emailError) {
          console.error('Failed to send seller-approved email:', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        message: `KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        data: {
          kyc: {
            status: user.kyc.status,
            reviewedAt: user.kyc.reviewedAt,
            reviewedBy: user.kyc.reviewedBy,
            rejectionReason: user.kyc.rejectionReason,
          },
          role: user.role,
          shops: updatedShops,
        },
      });
    } catch (error: any) {
      console.error('KYC review error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to review KYC' },
        { status: 500 }
      );
    }
  })(request);
}







