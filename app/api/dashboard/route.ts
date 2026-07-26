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

const DEMO_ACTIVITIES = [
  {
    _id: 'ob-1',
    obNumber: 'OB/2026/07/001',
    date: getTodayDate(),
    time: '08:30',
    category: 'shift',
    priority: 'low',
    entry: 'Morning security shift handover completed. All posts manned, equipment checked and verified operational.',
    officer: 'John Mensah',
    status: 'closed',
  },
  {
    _id: 'ob-2',
    obNumber: 'OB/2026/07/002',
    date: getTodayDate(),
    time: '09:15',
    category: 'visitor',
    priority: 'low',
    entry: 'VIP Guest Arrival registered at Main Gate — 12 corporate delegation members for Resort Conference.',
    officer: 'Grace Osei',
    status: 'closed',
  },
  {
    _id: 'ob-3',
    obNumber: 'OB/2026/07/003',
    date: getTodayDate(),
    time: '10:05',
    category: 'goods',
    priority: 'medium',
    entry: 'Delivery received: Food & Beverage supplies (35 crates). Invoice verified against Gate Pass GP-8841.',
    officer: 'John Mensah',
    status: 'closed',
  },
  {
    _id: 'ob-4',
    obNumber: 'OB/2026/07/004',
    date: getTodayDate(),
    time: '10:45',
    category: 'patrol',
    priority: 'low',
    entry: 'Perimeter patrol completed around Water Sports Zone and Island Dock. No security anomalies observed.',
    officer: 'Kwame Asante',
    status: 'closed',
  },
  {
    _id: 'ob-5',
    obNumber: 'OB/2026/07/005',
    date: getTodayDate(),
    time: '11:20',
    category: 'incident',
    priority: 'high',
    entry: 'Unclaimed bag reported near Chalet 14. Perimeter secured and bag scanned; returned to guest upon ID verification.',
    officer: 'Ama Darko',
    status: 'closed',
  },
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const today = getTodayDate();

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
      UserModel.countDocuments({ isActive: true, role: { $in: ['officer', 'supervisor'] } }),
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
    console.warn('Database connection unavailable, serving demo dashboard metrics...', error);

    return NextResponse.json({
      stats: {
        totalVisitorsToday: 24,
        goodsReceivedToday: 8,
        tipsReceived: 3,
        playbackRequests: 2,
        pendingIncidents: 1,
        staffOnDuty: 6,
      },
      recentActivities: DEMO_ACTIVITIES,
      mode: 'demo',
    });
  }
}
