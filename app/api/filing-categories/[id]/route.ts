import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { FilingCategoryModel } from '@/lib/models';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can manage categories.' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const categoryToDelete = await FilingCategoryModel.findById(id);
    if (!categoryToDelete) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await FilingCategoryModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
