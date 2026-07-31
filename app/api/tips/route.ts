import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { TipModel, ActivityLogModel } from '@/lib/models';
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

    // Fetch tips
    const entries = await TipModel.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Tips API GET Error:', error);
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

    if (!Array.isArray(data.tips)) {
      return NextResponse.json({ error: 'Invalid data format. Expected an array of tips.' }, { status: 400 });
    }

    const tipsToInsert = data.tips.map((tip: any) => ({
      ...tip,
      createdBy: session.userId,
    }));

    if (tipsToInsert.length === 0) {
      return NextResponse.json({ error: 'No tips provided.' }, { status: 400 });
    }

    await TipModel.insertMany(tipsToInsert);

    // Log Activity
    await ActivityLogModel.create({
      action: 'Logged Tips/Gratuities',
      module: 'Tips',
      description: `Logged ${tipsToInsert.length} staff gratuity records.`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ success: true, count: tipsToInsert.length }, { status: 201 });
  } catch (error) {
    console.error('Tips API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
