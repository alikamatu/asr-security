import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const DEMO_USERS_LIST = [
  { _id: 'demo-admin-1', name: 'Admin User', email: 'admin@aquasafari.com', role: 'admin', department: 'Administration', signatureCode: '10001', isActive: true },
  { _id: 'demo-john-2', name: 'John Mensah', email: 'john@aquasafari.com', role: 'officer', department: 'Control Room', signatureCode: '10002', isActive: true },
  { _id: 'demo-grace-3', name: 'Grace Osei', email: 'grace@aquasafari.com', role: 'officer', department: 'Control Room', signatureCode: '10003', isActive: true },
  { _id: 'demo-kwame-4', name: 'Kwame Asante', email: 'kwame@aquasafari.com', role: 'supervisor', department: 'Operations', signatureCode: '10004', isActive: true },
  { _id: 'demo-ama-5', name: 'Ama Darko', email: 'ama@aquasafari.com', role: 'manager', department: 'Management', signatureCode: '10005', isActive: true },
];

export async function GET() {
  try {
    const session = await getSession();
    // Only Admin or Manager can view users
    if (!session || !['admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
      await connectDB();
      const users = await UserModel.find().select('-password').sort({ role: 1, name: 1 }).lean();
      return NextResponse.json({ users });
    } catch (dbError) {
      console.warn('Database unavailable for GET /api/users, returning demo users list...', dbError);
      return NextResponse.json({ users: DEMO_USERS_LIST, mode: 'demo' });
    }
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

    const data = await request.json();

    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Validate 5-digit signature code
    const signatureCode = String(data.signatureCode || '').trim();
    if (!/^\d{5}$/.test(signatureCode)) {
      return NextResponse.json({ error: 'Digital signature code must be exactly 5 numeric digits (e.g. 12345)' }, { status: 400 });
    }

    try {
      await connectDB();

      const existingUser = await UserModel.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = new UserModel({
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role || 'officer',
        department: data.department || 'Security',
        signatureCode: signatureCode,
        isActive: true,
      });

      await newUser.save();

      const userObj = newUser.toObject();
      delete userObj.password;

      return NextResponse.json({ user: userObj }, { status: 201 });
    } catch (dbError) {
      console.warn('Database unavailable for POST /api/users, returning demo mock user...', dbError);

      const demoUser = {
        _id: `demo-${Date.now()}`,
        name: data.name,
        email: data.email.toLowerCase(),
        role: data.role || 'officer',
        department: data.department || 'Security',
        signatureCode: signatureCode,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({ user: demoUser, mode: 'demo' }, { status: 201 });
    }
  } catch (error) {
    console.error('User API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
