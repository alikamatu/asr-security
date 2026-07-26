import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { GoodsEntryModel, UserModel } from '@/lib/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query') || '';

    await connectDB();

    if (type === 'item') {
      // Find distinct item descriptions matching the query
      const items = await GoodsEntryModel.distinct('itemDescription', {
        itemDescription: { $regex: query, $options: 'i' },
      });
      return NextResponse.json({ options: items.slice(0, 10) });
    }

    if (type === 'user' || type === 'staff') {
      // Find active users matching the query
      const users = await UserModel.find(
        { name: { $regex: query, $options: 'i' }, isActive: true },
        'name'
      ).limit(10);
      return NextResponse.json({ options: users.map(u => u.name) });
    }
    
    if (type === 'storesPerson') {
      // Fetch distinct stores persons from past entries, and also combine with active users
      const storedPersons = await GoodsEntryModel.distinct('storesPersonName', {
        storesPersonName: { $regex: query, $options: 'i' },
      });
      
      const users = await UserModel.find(
        { name: { $regex: query, $options: 'i' }, isActive: true },
        'name'
      ).limit(5);
      
      const allNames = Array.from(new Set([...storedPersons, ...users.map(u => u.name)])).filter(Boolean);
      return NextResponse.json({ options: allNames.slice(0, 10) });
    }

    return NextResponse.json({ options: [] });
  } catch (error) {
    console.error('Autocomplete API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autocomplete options' },
      { status: 500 }
    );
  }
}
