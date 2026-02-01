import Link from "next/link";
import { getSession } from "@/lib/auth"; // We import our helper
import { logoutAction } from "@/app/actions/auth-actions";

export default async function NavBar() {
  const session = await getSession();

  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
      <div className="text-xl font-bold text-indigo-600">
        <Link href="/">AutoMagnet</Link>
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <>
            <span className="text-sm text-gray-600">Hello, {session.username}</span>
            <form action={logoutAction}>
              <button className="text-sm text-red-600 hover:text-red-800">
                Logout
              </button>
            </form>
          </>
        ) : (
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}