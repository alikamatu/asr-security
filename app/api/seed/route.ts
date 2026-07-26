import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';

// Seed default users for development
const DEFAULT_USERS = [
  { name: 'Admin User', email: 'admin@aquasafari.com', password: 'admin123', role: 'admin', department: 'Administration', signatureCode: '10001' },
  { name: 'John Mensah', email: 'john@aquasafari.com', password: 'officer123', role: 'officer', department: 'Control Room', signatureCode: '10002' },
  { name: 'Grace Osei', email: 'grace@aquasafari.com', password: 'officer123', role: 'officer', department: 'Control Room', signatureCode: '10003' },
  { name: 'Kwame Asante', email: 'kwame@aquasafari.com', password: 'supervisor123', role: 'supervisor', department: 'Operations', signatureCode: '10004' },
  { name: 'Ama Darko', email: 'ama@aquasafari.com', password: 'manager123', role: 'manager', department: 'Management', signatureCode: '10005' },
];

export async function POST() {
  try {
    await connectDB();

    const existingCount = await UserModel.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Database already seeded', count: existingCount });
    }

    const usersToCreate = await Promise.all(
      DEFAULT_USERS.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 12),
        isActive: true,
      }))
    );

    await UserModel.insertMany(usersToCreate);

    return NextResponse.json({
      message: 'Database seeded successfully',
      users: DEFAULT_USERS.map(({ password: _, ...u }) => u),
    });
  } catch (error) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Failed to seed database';
    return NextResponse.json(
      { error: `Database error (${message}). Check network or MongoDB service.` },
      { status: 500 }
    );
  }
}
