import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { PlaybackEntryModel, ActivityLogModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { generateEvidenceNumber } from '@/lib/utils';

// Force node runtime to handle file streams properly
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all playback entries
    const entries = await PlaybackEntryModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Playback API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Parse timelines array which was sent as JSON string
    const timelinesStr = formData.get('timelinesStr') as string;
    let timelinesMeta: any[] = [];
    if (timelinesStr) {
      try {
        timelinesMeta = JSON.parse(timelinesStr);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid timelines data format' }, { status: 400 });
      }
    }

    const timelinesToSave = [];
    let totalSize = 0;

    for (let i = 0; i < timelinesMeta.length; i++) {
      const meta = timelinesMeta[i];
      const file = formData.get(`timelineFile_${i}`) as File | null;
      
      let videoData = '';
      let originalFileName = '';
      let mimeType = '';
      let size = 0;

      if (file && file instanceof Blob) {
        totalSize += file.size;
        if (totalSize > 10 * 1024 * 1024) { // 10MB limit
          return NextResponse.json({ error: 'Total video size exceeds the 10MB limit. Please upload smaller clips.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString('base64');
        mimeType = file.type || 'video/mp4';
        videoData = `data:${mimeType};base64,${base64Data}`;
        originalFileName = file.name;
        size = file.size;
      }

      timelinesToSave.push({
        date: meta.date,
        time: meta.time,
        description: meta.description,
        videoData,
        originalFileName,
        mimeType,
        size
      });
    }

    await connectDB();

    const evidenceNumber = generateEvidenceNumber();

    const newEntry = await PlaybackEntryModel.create({
      title,
      description,
      evidenceNumber,
      timelines: timelinesToSave,
      uploadedBy: session.userId,
      uploaderName: session.name,
    });

    // Log Activity
    await ActivityLogModel.create({
      action: 'Logged Playback',
      module: 'Playback',
      description: `Logged playback "${title}" with ${timelinesToSave.length} timelines`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Playback API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
