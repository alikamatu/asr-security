import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { EquipmentModel, OBEntryModel } from '@/lib/models';
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

    const equipment = await EquipmentModel.findById(id);
    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Handle return
    if (body.action === 'return') {
      equipment.status = 'returned';
      equipment.timeReturned = getCurrentTime();
      equipment.conditionOnReturn = body.conditionOnReturn;
      equipment.returnedTo = session.name;
      await equipment.save();

      // Log return in OB
      await OBEntryModel.create({
        date: getTodayDate(),
        time: getCurrentTime(),
        category: 'equipment',
        priority: body.conditionOnReturn !== 'good' ? 'high' : 'low',
        entry: `Equipment Returned: ${equipment.itemName} (SN: ${equipment.serialNumber}) by ${equipment.issuedTo}. Condition: ${body.conditionOnReturn}.`,
        officer: session.name,
        createdBy: session.userId,
      });
      
      return NextResponse.json({ equipment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Equipment Action Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
