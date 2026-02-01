"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth-actions";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-sm text-gray-500 mt-2">Join AutoMagnet to get started</p>
          </div>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  Enter Username
                </div>
                <input name="username" type="text" required className=" text-black w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none" placeholder="username" />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  Enter Password
                </div>
                <input name="password" type="password" required className="w-full pl-10 pr-4 py-3 border text-blackrounded-lg focus:ring-2 focus:ring-purple-500 transition-all outline-none" placeholder="••••••••" />
              </div>
              <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Already have an account? <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}