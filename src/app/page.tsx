import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard for authenticated users
  // The middleware will handle redirecting unauthenticated users to login
  redirect('/dashboard');
}
