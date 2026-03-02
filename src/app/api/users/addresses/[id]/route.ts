import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// PUT /api/users/addresses/:id - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();

      await connectDB();

      const userDoc = await User.findById(user.userId);
      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const address = userDoc.addresses.find(
        (addr: any) => addr._id.toString() === params.id
      );
      if (!address) {
        return NextResponse.json(
          { success: false, message: 'Address not found' },
          { status: 404 }
        );
      }

      // Update address fields
      Object.keys(body).forEach((key) => {
        if (key !== 'isDefault' && body[key] !== undefined) {
          // Handle field name mapping for consistency
          if (key === 'line1') {
            (address as any).addressLine1 = body[key];
          } else if (key === 'line2') {
            (address as any).addressLine2 = body[key];
          } else {
            (address as any)[key] = body[key];
          }
        }
      });

      // Handle default address
      if (body.isDefault === true) {
        userDoc.addresses.forEach((addr: any) => {
          addr.isDefault = addr._id.toString() === params.id;
        });
      }

      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error: any) {
      console.error('Update address error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update address' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/users/addresses/:id - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const userDoc = await User.findById(user.userId);
      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const addressIndex = userDoc.addresses.findIndex(
        (addr: any) => addr._id.toString() === params.id
      );
      if (addressIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Address not found' },
          { status: 404 }
        );
      }

      userDoc.addresses.splice(addressIndex, 1);
      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete address error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete address' },
        { status: 500 }
      );
    }
  })(request);
}

