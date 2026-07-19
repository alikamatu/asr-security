import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { OBEntryModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { getTodayDate } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getTodayDate();

    await connectDB();
    
    // Fetch OB entries for a specific date, descending by time
    const entries = await OBEntryModel.find({ date })
      .sort({ time: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('OB API Error:', error);
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

    const newEntry = new OBEntryModel({
      ...data,
      officer: session.name, // Auto-assign officer from session
      createdBy: session.userId,
    });

    await newEntry.save();

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('OB API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
