import { NextResponse } from 'next/server';
import { importFromUrl } from '@/lib/importer';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    const data = await importFromUrl(url);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to import recipe' }, { status: 500 });
  }
}
