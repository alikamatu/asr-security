import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { GoodsEntryModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all goods entries, sorted by date and time descending
    const entries = await GoodsEntryModel.find()
      .sort({ date: -1, time: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Goods API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    const newEntry = new GoodsEntryModel({
      ...data,
      securityOfficer: session.name, // Auto-assign officer from session
      createdBy: session.userId,
    });

    await newEntry.save();

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Goods API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
