"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { formatDate, getInitials } from "@/lib/utils";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Clock, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  totalCounsellors: number;
  pendingApprovals: number;
  activeSessions: number;
}

interface RecentUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: { toDate: () => Date } | undefined;
  verificationStatus?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCounsellors: 0,
    pendingApprovals: 0,
    activeSessions: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as RecentUser[];

        // Calculate stats
        const totalUsers = users.filter((u) => u.role === "user").length;
        const totalCounsellors = users.filter((u) => u.role === "counsellor" && u.verificationStatus === "verified").length;
        const pendingApprovals = users.filter((u) => u.role === "counsellor" && u.verificationStatus === "pending").length;

        // Fetch sessions count
        const sessionsQuery = query(
          collection(db, "sessions"),
          where("status", "==", "confirmed")
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);

        setStats({
          totalUsers,
          totalCounsellors,
          pendingApprovals,
          activeSessions: sessionsSnapshot.size,
        });

        // Get recent users
        const recentQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQuery);
        setRecentUsers(recentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as RecentUser[]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Verified Counsellors", value: stats.totalCounsellors, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
    { title: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Active Sessions", value: stats.activeSessions, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {getInitials(user.displayName)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={user.role === "counsellor" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
