import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { 
  VisitorModel, 
  GoodsEntryModel, 
  TipModel, 
  PlaybackEntryModel, 
  IncidentModel, 
  UserModel,
  OBEntryModel 
} from '@/lib/models';
import { getTodayDate } from '@/lib/utils';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const today = getTodayDate();

    // Fetch stats concurrently
    const [
      totalVisitorsToday,
      goodsReceivedToday,
      tipsReceived,
      playbackRequests,
      pendingIncidents,
      staffOnDuty,
      recentActivities
    ] = await Promise.all([
      VisitorModel.countDocuments({ date: today }),
      GoodsEntryModel.countDocuments({ date: today }),
      TipModel.countDocuments({ date: today }),
      PlaybackEntryModel.countDocuments({ date: today }),
      IncidentModel.countDocuments({ status: { $in: ['open', 'investigating'] } }),
      UserModel.countDocuments({ isActive: true, role: { $in: ['officer', 'supervisor'] } }), // Simplified proxy for staff on duty
      OBEntryModel.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    return NextResponse.json({
      stats: {
        totalVisitorsToday,
        goodsReceivedToday,
        tipsReceived,
        playbackRequests,
        pendingIncidents,
        staffOnDuty,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
