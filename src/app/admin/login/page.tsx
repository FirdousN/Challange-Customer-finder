import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import StaffLoginForm from '@/components/auth/StaffLoginForm';

export default async function StaffLoginPage() {
  const session = await getSession();
  
  if (session.userId) {
    if (session.role === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/staff/scanner');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-md border border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            YB Posing Challenge
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Staff Login
          </p>
        </div>
        <StaffLoginForm />
      </div>
    </div>
  );
}
