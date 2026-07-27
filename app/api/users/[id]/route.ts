import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { UserModel, ActivityLogModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PUT: Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can modify users.' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    await connectDB();

    const userToUpdate = await UserModel.findById(id);
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying other superadmins unless you are one
    if (userToUpdate.role === 'superadmin' && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'You do not have permission to modify a superadmin.' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) {
      const email = data.email.toLowerCase();
      // Check if new email already exists
      if (email !== userToUpdate.email) {
        const existing = await UserModel.findOne({ email });
        if (existing) {
          return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }
      }
      updateData.email = email;
    }
    
    if (data.role) {
      // Only superadmin can promote someone to superadmin
      if (data.role === 'superadmin' && session.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only superadmins can assign the superadmin role.' }, { status: 403 });
      }
      updateData.role = data.role;
    }
    
    if (data.department) updateData.department = data.department;
    
    if (data.signatureCode !== undefined) {
      const code = String(data.signatureCode).trim();
      if (code && !/^\d{5}$/.test(code)) {
        return NextResponse.json({ error: 'Digital signature code must be exactly 5 numeric digits' }, { status: 400 });
      }
      updateData.signatureCode = code;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.password) {
      if (data.password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password').lean();

    // Log the activity
    await ActivityLogModel.create({
      action: 'Modified User',
      module: 'Users',
      description: `Modified account for ${updatedUser.name} (${updatedUser.email})`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('User API PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can delete users.' }, { status: 403 });
    }

    const { id } = await params;
    
    // Prevent self-deletion
    if (id === session.userId) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    await connectDB();

    const userToDelete = await UserModel.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToDelete.role === 'superadmin' && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'You do not have permission to delete a superadmin.' }, { status: 403 });
    }

    await UserModel.findByIdAndDelete(id);

    // Log the activity
    await ActivityLogModel.create({
      action: 'Deleted User',
      module: 'Users',
      description: `Deleted account for ${userToDelete.name} (${userToDelete.email})`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('User API DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
