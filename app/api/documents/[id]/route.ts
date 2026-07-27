import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { DocumentEntryModel, ActivityLogModel } from '@/lib/models';
import { promises as fs } from 'fs';
import path from 'path';

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

    // Attempt to delete physical files
    if (documentToDelete.files && documentToDelete.files.length > 0) {
      const publicDir = path.join(process.cwd(), 'public');
      for (const file of documentToDelete.files) {
        if (file.fileUrl) {
          const filePath = path.join(publicDir, file.fileUrl);
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(`Could not delete physical file ${filePath}`, err);
          }
        }
      }
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
