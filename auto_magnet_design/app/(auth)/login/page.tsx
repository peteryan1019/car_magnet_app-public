"use client"; // <--- Add this

import Link from "next/link";
import { useActionState } from "react"; // <--- Import hook
import { loginAction } from "@/app/actions/auth-actions";

export default function LoginPage() {
  // Setup the hook. The first argument is the action, second is initial state
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-900 font-sans p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden -translate-y-8">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Show Error Message if it exists */}
          {state?.error && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-300 text-sm rounded-lg border border-red-800 text-center">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-400 text-white"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-400 text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-50"
            >
              {isPending ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-slate-800/80 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
