import { cookies } from 'next/headers';

export async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return !!token;
}
