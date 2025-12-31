"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import LoginForm from "@/components/LoginForm";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare } from "lucide-react";

export default function ChatsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Chat Management</h1>
        <p className="text-gray-500 mt-1">Monitor and manage platform conversations</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h2>
          <p className="text-gray-500">Chat management features are under development</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
