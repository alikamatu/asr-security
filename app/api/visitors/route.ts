import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { VisitorModel, ActivityLogModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();
    
    let query: any = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Fetch all foreign visitors
    const entries = await VisitorModel.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Visitor API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    if (!Array.isArray(data.visitors)) {
      return NextResponse.json({ error: 'Invalid data format. Expected an array of visitors.' }, { status: 400 });
    }

    const visitorsToInsert = data.visitors.map((visitor: any) => ({
      ...visitor,
      total: Number(visitor.adults) + Number(visitor.kids) + Number(visitor.kidsUnderSix),
      createdBy: session.userId,
    }));

    if (visitorsToInsert.length === 0) {
      return NextResponse.json({ error: 'No visitors provided.' }, { status: 400 });
    }

    await VisitorModel.insertMany(visitorsToInsert);

    // Log Activity
    await ActivityLogModel.create({
      action: 'Logged Foreign Visitors',
      module: 'Visitors',
      description: `Logged ${visitorsToInsert.length} foreign visitor records.`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ success: true, count: visitorsToInsert.length }, { status: 201 });
  } catch (error) {
    console.error('Visitor API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
