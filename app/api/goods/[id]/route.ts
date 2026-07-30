import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { GoodsEntryModel, UserModel, OBEntryModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { getTodayDate, getCurrentTime } from '@/lib/utils';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { updates, editorName, pin } = await request.json();

    if (!editorName || !pin) {
      return NextResponse.json({ error: 'Editor name and PIN are required' }, { status: 400 });
    }

    // Verify the editor's PIN
    const user = await UserModel.findOne({ name: editorName });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.signatureCode || user.signatureCode !== pin) {
      return NextResponse.json({ error: 'Invalid PIN. Please try again.' }, { status: 403 });
    }

    // Find the existing goods entry
    const existingEntry = await GoodsEntryModel.findById(id);
    if (!existingEntry) {
      return NextResponse.json({ error: 'Goods entry not found' }, { status: 404 });
    }

    // Build the log string for the OB Entry
    const changes: string[] = [];
    if (updates.itemDescription && updates.itemDescription !== existingEntry.itemDescription) {
      changes.push(`Item changed from "${existingEntry.itemDescription}" to "${updates.itemDescription}"`);
    }
    if (updates.quantity !== undefined && updates.quantity !== existingEntry.quantity) {
      changes.push(`Qty changed from ${existingEntry.quantity} to ${updates.quantity}`);
    }
    if (updates.quantityUnit !== undefined && updates.quantityUnit !== existingEntry.quantityUnit) {
      changes.push(`Unit changed from ${existingEntry.quantityUnit || 'None'} to ${updates.quantityUnit}`);
    }
    if (updates.departmentReceiving && updates.departmentReceiving !== existingEntry.departmentReceiving) {
      changes.push(`Destination changed from ${existingEntry.departmentReceiving} to ${updates.departmentReceiving}`);
    }
    if (updates.receivedBy && updates.receivedBy !== existingEntry.receivedBy) {
      changes.push(`Received By changed from ${existingEntry.receivedBy} to ${updates.receivedBy}`);
    }

    // Only update if there are changes
    if (changes.length > 0) {
      // Update goods entry
      await GoodsEntryModel.findByIdAndUpdate(id, { $set: updates });

      // Log the edit in the OB
      const obEntryText = `Goods Entry Edited (ID: ${id.slice(-4)}): ${changes.join(', ')}. Edited by: ${editorName}.`;
      
      const newOB = new OBEntryModel({
        date: getTodayDate(),
        time: getCurrentTime(),
        entry: obEntryText,
        officer: editorName,
        category: 'goods',
        priority: 'medium',
        createdBy: user._id.toString()
      });
      await newOB.save();
    }

    return NextResponse.json({ message: 'Goods updated successfully' });
  } catch (error) {
    console.error('Goods Edit API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
