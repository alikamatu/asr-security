import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { LostFoundModel, OBEntryModel } from '@/lib/models';
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

    const item = await LostFoundModel.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Handle claim
    if (body.action === 'claim') {
      item.status = 'claimed';
      item.claimedBy = body.claimedBy;
      item.claimantId = body.claimantId;
      item.claimantPhone = body.claimantPhone;
      item.dateClaimed = getTodayDate();
      await item.save();

      // Log claim in OB
      await OBEntryModel.create({
        date: getTodayDate(),
        time: getCurrentTime(),
        category: 'general',
        priority: 'low',
        entry: `Lost & Found Item Claimed: ${item.itemDescription}. Claimed by ${body.claimedBy} (ID: ${body.claimantId}). Released by ${session.name}.`,
        officer: session.name,
        createdBy: session.userId,
      });
      
      return NextResponse.json({ item });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Lost & Found Action Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
