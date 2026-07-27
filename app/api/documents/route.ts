import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { DocumentEntryModel, ActivityLogModel } from '@/lib/models';
import { promises as fs } from 'fs';
import path from 'path';

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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    
    // Ensure dir exists (we created it earlier but good to be safe)
    await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

    const fileRecords = [];

    // Save physical files
    for (const file of uploadedFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Generate safe unique filename
      const originalName = file.name;
      const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${safeName}`;
      
      const filePath = path.join(uploadDir, uniqueFileName);
      await fs.writeFile(filePath, buffer);

      fileRecords.push({
        fileUrl: `/uploads/documents/${uniqueFileName}`,
        originalName: originalName,
        mimeType: file.type || 'application/octet-stream',
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
