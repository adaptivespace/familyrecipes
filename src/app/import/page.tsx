import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ImportForm from '@/components/ImportForm';

export default async function Page() {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/login');
  }
  return <ImportForm />;
}
