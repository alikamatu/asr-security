import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { FilingCategoryModel } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const categories = await FilingCategoryModel.find()
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching filing categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    // Only admin and superadmin can add categories
    if (!session || !['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can manage categories.' }, { status: 403 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Valid category name is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if category already exists
    const existing = await FilingCategoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 });
    }

    const newCategory = await FilingCategoryModel.create({
      name,
      createdBy: session.name,
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating filing category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
