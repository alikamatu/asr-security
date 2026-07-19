import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { VisitorModel } from '@/lib/models';
import { getSession } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all visitors, sorted by date and time descending
    const entries = await VisitorModel.find()
      .sort({ date: -1, timeIn: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Visitor API Error:', error);
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

    // Generate QR Code data (base64)
    const qrData = JSON.stringify({
      pass: data.visitorPassNumber,
      name: data.visitorName,
      company: data.company,
      date: data.date,
    });
    const qrCodeImage = await QRCode.toDataURL(qrData);

    const newEntry = new VisitorModel({
      ...data,
      qrCode: qrCodeImage,
      securityOfficer: session.name, // Auto-assign officer from session
      createdBy: session.userId,
    });

    await newEntry.save();

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Visitor API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
