import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { GoodsEntryModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { ids, approverName, pin, remainders = {} } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No items selected for approval' }, { status: 400 });
    }

    if (!approverName || !pin) {
      return NextResponse.json({ error: 'Approver name and PIN are required' }, { status: 400 });
    }

    // Verify the approver's PIN
    const user = await UserModel.findOne({ name: approverName });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.signatureCode || user.signatureCode !== pin) {
      return NextResponse.json({ error: 'Invalid PIN. Please try again.' }, { status: 403 });
    }

    // Prepare bulk operations to handle per-item remainders
    const operations = ids.map((id: string) => {
      const rem = remainders[id];
      const hasRemainder = rem !== undefined && rem !== null;
      
      const updateData: any = {
        status: hasRemainder ? 'Remainder' : 'Approved',
        approvedBy: approverName,
        approvedAt: new Date(),
        approvalSignature: user.signatureCode,
      };

      const unsetData: any = {};

      if (hasRemainder) {
        updateData.hasRemainder = true;
        updateData.remainder = rem;
      } else {
        updateData.hasRemainder = false;
        unsetData.remainder = "";
      }

      const updateOp: any = { $set: updateData };
      if (Object.keys(unsetData).length > 0) {
        updateOp.$unset = unsetData;
      }

      return {
        updateOne: {
          filter: { _id: id },
          update: updateOp
        }
      };
    });

    const result = await GoodsEntryModel.bulkWrite(operations);

    return NextResponse.json({
      message: `${result.modifiedCount} item(s) approved successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Goods Approve API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
