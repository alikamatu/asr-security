import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ActivityLogModel } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch last 100 activity logs
    const logs = await ActivityLogModel.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
