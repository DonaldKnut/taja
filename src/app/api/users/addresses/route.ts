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
      const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault, line1, line2 } = body;

      // Map line1/line2 to addressLine1/addressLine2 if provided (compatibility with frontend)
      const finalAddressLine1 = addressLine1 || line1;
      const finalAddressLine2 = addressLine2 || line2;

      if (!fullName || !phone || !finalAddressLine1 || !city || !state || !country) {
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
        addressLine1: finalAddressLine1,
        addressLine2: finalAddressLine2,
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

// PATCH /api/users/addresses - Update address or set as default
export async function PATCH(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { addressId, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault, line1, line2 } = body;

      if (!addressId) {
        return NextResponse.json(
          { success: false, message: 'addressId is required' },
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

      const addressIndex = userDoc.addresses.findIndex((addr: any) => addr._id.toString() === addressId);
      if (addressIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Address not found' },
          { status: 404 }
        );
      }

      // If set as default, unset others first
      if (isDefault) {
        userDoc.addresses.forEach((addr: any) => {
          addr.isDefault = false;
        });
      }

      // Update fields
      const finalAddressLine1 = addressLine1 || line1;
      const finalAddressLine2 = addressLine2 || line2;

      if (fullName) userDoc.addresses[addressIndex].fullName = fullName;
      if (phone) userDoc.addresses[addressIndex].phone = phone;
      if (finalAddressLine1) userDoc.addresses[addressIndex].addressLine1 = finalAddressLine1;
      if (finalAddressLine2 !== undefined) userDoc.addresses[addressIndex].addressLine2 = finalAddressLine2;
      if (city) userDoc.addresses[addressIndex].city = city;
      if (state) userDoc.addresses[addressIndex].state = state;
      if (postalCode) userDoc.addresses[addressIndex].postalCode = postalCode;
      if (country) userDoc.addresses[addressIndex].country = country;
      if (isDefault !== undefined) userDoc.addresses[addressIndex].isDefault = isDefault;

      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: 'Address updated successfully',
        data: userDoc.addresses[addressIndex],
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

// DELETE /api/users/addresses - Delete address
export async function DELETE(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const addressId = searchParams.get('addressId');

      if (!addressId) {
        return NextResponse.json(
          { success: false, message: 'addressId is required' },
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

      const initialLength = userDoc.addresses.length;
      userDoc.addresses = userDoc.addresses.filter((addr: any) => addr._id.toString() !== addressId);

      if (userDoc.addresses.length === initialLength) {
        return NextResponse.json(
          { success: false, message: 'Address not found' },
          { status: 404 }
        );
      }

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








