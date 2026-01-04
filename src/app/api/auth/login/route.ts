import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.json();
  const password = body.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 });
  }

  if (password === adminPassword) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const cookieStore = await cookies();
    cookieStore.set('admin_token', hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
