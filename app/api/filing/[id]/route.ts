import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { FilingEntryModel, ActivityLogModel } from '@/lib/models';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can delete filed documents.' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const filingToDelete = await FilingEntryModel.findById(id);
    if (!filingToDelete) {
      return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    }

    await FilingEntryModel.findByIdAndDelete(id);

    // Log Activity
    await ActivityLogModel.create({
      action: 'Deleted Filed Document',
      module: 'Filing',
      description: `Deleted filed document: "${filingToDelete.generatedFileName}"`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting filing:', error);
    return NextResponse.json({ error: 'Failed to delete filing' }, { status: 500 });
  }
}
