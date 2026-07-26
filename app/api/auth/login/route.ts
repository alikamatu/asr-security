import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';
import { createToken, setSessionCookie } from '@/lib/auth';

const DEMO_USERS = [
  { _id: 'demo-admin-1', name: 'Admin User', email: 'admin@aquasafari.com', password: 'admin123', role: 'admin' as const, signatureCode: '10001' },
  { _id: 'demo-john-2', name: 'John Mensah', email: 'john@aquasafari.com', password: 'officer123', role: 'officer' as const, signatureCode: '10002' },
  { _id: 'demo-grace-3', name: 'Grace Osei', email: 'grace@aquasafari.com', password: 'officer123', role: 'officer' as const, signatureCode: '10003' },
  { _id: 'demo-kwame-4', name: 'Kwame Asante', email: 'kwame@aquasafari.com', password: 'supervisor123', role: 'supervisor' as const, signatureCode: '10004' },
  { _id: 'demo-ama-5', name: 'Ama Darko', email: 'ama@aquasafari.com', password: 'manager123', role: 'manager' as const, signatureCode: '10005' },
];

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Try DB login first
  try {
    await connectDB();

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = await createToken({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (dbError) {
    console.warn('Database connection unavailable, checking demo fallback accounts...', dbError);

    // Fallback to Demo Mode when MongoDB is unreachable
    const demoUser = DEMO_USERS.find((u) => u.email === normalizedEmail);
    if (demoUser && demoUser.password === password) {
      const token = await createToken({
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
      });

      await setSessionCookie(token);

      return NextResponse.json({
        user: {
          _id: demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
        },
        mode: 'demo',
      });
    }

    const errMsg = dbError instanceof Error ? dbError.message : 'Connection refused';
    return NextResponse.json(
      {
        error: `Database unavailable (${errMsg}). You can still sign in with demo accounts:\n• admin@aquasafari.com / admin123\n• john@aquasafari.com / officer123\n• kwame@aquasafari.com / supervisor123\n• ama@aquasafari.com / manager123`,
      },
      { status: 500 }
    );
  }
}
