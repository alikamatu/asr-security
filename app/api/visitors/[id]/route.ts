import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { VisitorModel, OBEntryModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { getCurrentTime, getTodayDate } from '@/lib/utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = (await params).id;
    const body = await request.json();

    await connectDB();

    const visitor = await VisitorModel.findById(id);
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    // Handle check-out
    if (body.action === 'checkout') {
      visitor.status = 'checked-out';
      visitor.timeOut = getCurrentTime();
      await visitor.save();

      // Log checkout in OB
      await OBEntryModel.create({
        date: getTodayDate(),
        time: getCurrentTime(),
        category: 'visitor',
        priority: 'low',
        entry: `Visitor Checked Out: ${visitor.visitorName} (${visitor.company}) departed at ${visitor.timeOut}.`,
        officer: session.name,
        createdBy: session.userId,
      });
      
      return NextResponse.json({ visitor });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Visitor Action Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
