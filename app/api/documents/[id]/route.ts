import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { DocumentEntryModel, ActivityLogModel } from '@/lib/models';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    // Only admin and superadmin can delete documents
    if (!session || !['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can delete documents.' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const documentToDelete = await DocumentEntryModel.findById(id);
    if (!documentToDelete) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete DB record
    await DocumentEntryModel.findByIdAndDelete(id);

    // Log Activity
    await ActivityLogModel.create({
      action: 'Deleted Document',
      module: 'Documents',
      description: `Deleted document package: "${documentToDelete.title}"`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
