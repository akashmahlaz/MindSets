"use client";

import Dashboard from "@/components/Dashboard";
import { DashboardLayout } from "@/components/dashboard-layout";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2AB09C]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-50 p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user.displayName || "Admin"}
        </p>
      </div>
      <Dashboard />
    </DashboardLayout>
  );
}
