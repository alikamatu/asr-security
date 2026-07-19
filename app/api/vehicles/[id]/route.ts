import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { VehicleModel, OBEntryModel } from '@/lib/models';
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

    const vehicle = await VehicleModel.findById(id);
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Handle check-out
    if (body.action === 'checkout') {
      vehicle.status = 'departed';
      vehicle.timeOut = getCurrentTime();
      await vehicle.save();

      // Optionally log departure in OB
      await OBEntryModel.create({
        date: getTodayDate(),
        time: getCurrentTime(),
        category: 'vehicle',
        priority: 'low',
        entry: `Vehicle Departed: ${vehicle.vehicleType} (${vehicle.registrationNumber}), Driver: ${vehicle.driverName}.`,
        officer: session.name,
        createdBy: session.userId,
      });
      
      return NextResponse.json({ vehicle });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Vehicle Action Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
