import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { FilingEntryModel, ActivityLogModel } from '@/lib/models';

// Force node runtime to handle file streams properly
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch all filings, newest first
    const filings = await FilingEntryModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ filings });
  } catch (error) {
    console.error('Error fetching filings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filings' },
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
    const categoryName = formData.get('categoryName') as string;
    
    // Get all files
    const uploadedFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof Blob) {
        uploadedFiles.push(value as File);
      }
    }

    if (!categoryName) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
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

    const savedEntries = [];

    // Save files as Base64 Data URIs
    for (const file of uploadedFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      // Generate filename: CategoryName_YYYYMMDD_UniqueID.ext
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ext = file.name.split('.').pop() || 'unknown';
      const safeCategory = categoryName.replace(/[^a-zA-Z0-9]/g, '');
      
      const generatedFileName = `${safeCategory}_${dateStr}_${uniqueId}.${ext}`;

      const newEntry = await FilingEntryModel.create({
        categoryName,
        generatedFileName,
        originalFileName: file.name,
        mimeType: mimeType,
        size: file.size,
        fileData: dataUri,
        uploadedBy: session.userId,
        uploaderName: session.name,
      });

      savedEntries.push(newEntry);
    }

    // Log Activity
    await ActivityLogModel.create({
      action: 'Filed Document',
      module: 'Filing',
      description: `Filed ${uploadedFiles.length} document(s) under category: "${categoryName}"`,
      performedBy: session.name,
      role: session.role,
    });

    return NextResponse.json({ success: true, count: savedEntries.length }, { status: 201 });
  } catch (error) {
    console.error('Error uploading filings:', error);
    return NextResponse.json(
      { error: 'Failed to upload filings' },
      { status: 500 }
    );
  }
}
