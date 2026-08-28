import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default async function StaffLoginPage() {
  const session = await getSession();

  if (session.userId) {
    redirect('/admin');

    // if (session.role === 'ADMIN') {
    // }
    // else {
    //   redirect('/staff/scanner');
    // }
  }

  return (
    <LoginForm role="ADMIN" />
  );
}
