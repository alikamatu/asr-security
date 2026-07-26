import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { GoodsEntryModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all goods entries, sorted by date and time descending
    const entries = await GoodsEntryModel.find()
      .sort({ date: -1, time: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Goods API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    if (data.items && Array.isArray(data.items)) {
      // Bulk insert for multiple items
      const entriesToInsert = data.items.map((item: any) => ({
        ...data, // includes date, time, supplier, receivedBy, etc.
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        quantityUnit: item.quantityUnit,
        securityOfficer: session.name, // Support older and newer session payload structure
        createdBy: session.userId,
      }));
      // Remove the items array from the root before spreading if we wanted, but it's fine since schema ignores it.
      
      const inserted = await GoodsEntryModel.insertMany(entriesToInsert);
      return NextResponse.json({ entries: inserted }, { status: 201 });
    } else {
      // Single item fallback
      const newEntry = new GoodsEntryModel({
        ...data,
        securityOfficer: session.name,
        createdBy: session.userId,
      });

      await newEntry.save();
      return NextResponse.json({ entry: newEntry }, { status: 201 });
    }
  } catch (error) {
    console.error('Goods API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
