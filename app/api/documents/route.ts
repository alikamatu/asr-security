import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { DocumentEntryModel, ActivityLogModel } from '@/lib/models';

// Force node runtime to handle file streams properly
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch all documents, newest first
    const documents = await DocumentEntryModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse formData
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const sensitivity = formData.get('sensitivity') as string;
    const colorLabel = formData.get('colorLabel') as string;
    
    // Get all files
    const uploadedFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof Blob) {
        uploadedFiles.push(value as File);
      }
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'At least one file must be uploaded' }, { status: 400 });
    }

    await connectToDatabase();

    // Check total size to avoid MongoDB 16MB BSON limit (Base64 adds ~33% overhead, so 10MB safe limit)
    const totalSize = uploadedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json({ error: 'Total file size exceeds the 10MB limit. Please upload smaller files.' }, { status: 400 });
    }

    const fileRecords = [];

    // Save files as Base64 Data URIs (bypasses Vercel read-only file system restrictions)
    for (const file of uploadedFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      fileRecords.push({
        fileUrl: dataUri,
        originalName: file.name,
        mimeType: mimeType,
        size: file.size,
      });
    }

    // Save DB metadata
    const newDoc = await DocumentEntryModel.create({
      title,
      description: description || '',
      sensitivity: sensitivity || 'internal',
      colorLabel: colorLabel || 'default',
      files: fileRecords,
      uploadedBy: session.userId,
      uploaderName: session.name,
    });

    // Log Activity
    await ActivityLogModel.create({
      action: 'Uploaded Document',
      module: 'Documents',
      description: `Uploaded document package: "${title}" (${uploadedFiles.length} files)`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
