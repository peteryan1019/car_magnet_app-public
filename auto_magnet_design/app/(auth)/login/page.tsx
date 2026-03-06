"use client"; // <--- Add this

import Link from "next/link";
import { useActionState } from "react"; // <--- Import hook
import { loginAction } from "@/app/actions/auth-actions";

export default function LoginPage() {
  // Setup the hook. The first argument is the action, second is initial state
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden -translate-y-[100px]">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Show Error Message if it exists */}
          {state?.error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-gray-300 text-gray-900"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-gray-300 text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors disabled:opacity-50"
            >
              {isPending ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
