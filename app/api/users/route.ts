import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    // Only Admin or Manager can view users
    if (!session || !['admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    
    // Fetch users (excluding passwords)
    const users = await UserModel.find().select('-password').sort({ role: 1, name: 1 }).lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can create users.' }, { status: 403 });
    }

    await connectDB();
    const data = await request.json();

    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = new UserModel({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      department: data.department,
      isActive: true
    });

    await newUser.save();

    const userObj = newUser.toObject();
    delete userObj.password;

    return NextResponse.json({ user: userObj }, { status: 201 });
  } catch (error) {
    console.error('User API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
