import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { 
  VisitorModel, 
  IncidentModel, 
  GoodsEntryModel,
  VehicleModel,
  TipModel,
  PlaybackEntryModel
} from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'manager', 'supervisor'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    await connectDB();

    const dateQuery = {
      date: {
        $gte: startDate,
        $lte: endDate,
      }
    };
    
    // Playback uses dateRequested, LostFound uses dateFound, Equipment uses dateIssued
    // but we'll stick to the core models that use 'date' for simple aggregation

    // Parallel aggregations
    const [
      visitors,
      incidents,
      goods,
      vehicles,
      tips,
      playbacks
    ] = await Promise.all([
      VisitorModel.countDocuments(dateQuery),
      IncidentModel.countDocuments(dateQuery),
      GoodsEntryModel.countDocuments(dateQuery),
      VehicleModel.countDocuments(dateQuery),
      TipModel.countDocuments(dateQuery),
      PlaybackEntryModel.countDocuments({
        dateRequested: { $gte: startDate, $lte: endDate }
      })
    ]);

    // Incident breakdown by status
    const incidentStatusBreakdown = await IncidentModel.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Visitor breakdown by department
    const visitorDeptBreakdown = await VisitorModel.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);

    return NextResponse.json({
      summary: {
        visitors,
        incidents,
        goods,
        vehicles,
        tips,
        playbacks,
      },
      breakdowns: {
        incidentsByStatus: incidentStatusBreakdown,
        visitorsByDepartment: visitorDeptBreakdown,
      }
    });

  } catch (error) {
    console.error('Reports API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
