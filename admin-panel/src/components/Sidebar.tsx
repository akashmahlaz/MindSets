"use client";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/users", label: "Users", icon: Users },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2AB09C] rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold font-[Papyrus]">M</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">MindSets</h1>
            <p className="text-xs text-[#2AB09C]">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-[#2AB09C] text-gray-50 shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-linear-to-br from-emerald-100 to-purple-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-600 font-semibold">
              {user?.displayName?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || "Admin"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
