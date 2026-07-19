import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { PlaybackEntryModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all playback entries, sorted by date requested descending
    const entries = await PlaybackEntryModel.find()
      .sort({ dateRequested: -1, timeRequested: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Playback API Error:', error);
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

    const newEntry = new PlaybackEntryModel({
      ...data,
      uploadedBy: session.name, // Auto-assign officer from session if uploading immediately
      createdBy: session.userId,
    });

    await newEntry.save();

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Playback API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
