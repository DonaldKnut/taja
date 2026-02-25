import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/users/addresses - Get user addresses
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const userDoc = await User.findById(user.userId).select('addresses');
      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: userDoc.addresses || [],
      });
    } catch (error: any) {
      console.error('Get addresses error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch addresses' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/users/addresses - Add address
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = body;

      if (!fullName || !phone || !addressLine1 || !city || !state || !country) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
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

      // If this is set as default, unset other defaults
      if (isDefault) {
        userDoc.addresses.forEach((addr: any) => {
          addr.isDefault = false;
        });
      }

      userDoc.addresses.push({
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        isDefault: isDefault || false,
      });

      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: 'Address added successfully',
        data: userDoc.addresses[userDoc.addresses.length - 1],
      });
    } catch (error: any) {
      console.error('Add address error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to add address' },
        { status: 500 }
      );
    }
  })(request);
}








