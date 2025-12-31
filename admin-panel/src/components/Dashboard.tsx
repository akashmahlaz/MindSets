"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { formatDate, getInitials } from "@/lib/utils";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  Clock,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  totalCounsellors: number;
  pendingApprovals: number;
  activeSessions: number;
  totalArticles: number;
  onlineUsers: number;
}

interface RecentUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | Date;
  verificationStatus?: string;
}

interface RecentActivity {
  id: string;
  type: "user_joined" | "counsellor_verified" | "session_booked" | "article_created";
  title: string;
  description: string;
  time: Date;
  icon: React.ReactNode;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCounsellors: 0,
    pendingApprovals: 0,
    activeSessions: 0,
    totalArticles: 0,
    onlineUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [pendingCounsellors, setPendingCounsellors] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as RecentUser[];

        // Fetch articles
        const articlesSnapshot = await getDocs(collection(db, "articles"));

        // Calculate stats
        const totalUsers = users.filter((u) => u.role === "user").length;
        const totalCounsellors = users.filter((u) => u.role === "counsellor" && u.verificationStatus === "verified").length;
        const pendingApprovals = users.filter((u) => u.role === "counsellor" && u.verificationStatus === "pending").length;
        const onlineUsers = users.filter((u) => u.status === "online").length;

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
          totalArticles: articlesSnapshot.size,
          onlineUsers,
        });

        // Get recent users
        const recentQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQuery);
        setRecentUsers(recentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as RecentUser[]);

        // Get pending counsellors
        const pendingCounsellorsData = users.filter(
          (u) => u.role === "counsellor" && u.verificationStatus === "pending"
        ).slice(0, 3);
        setPendingCounsellors(pendingCounsellorsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100",
      change: "+12%",
      trend: "up",
    },
    {
      title: "Verified Counsellors",
      value: stats.totalCounsellors,
      icon: ShieldCheck,
      color: "text-teal-600",
      bg: "bg-gradient-to-br from-teal-50 to-emerald-50",
      iconBg: "bg-teal-100",
      change: "+5%",
      trend: "up",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      iconBg: "bg-amber-100",
      change: stats.pendingApprovals > 0 ? "Action needed" : "All clear",
      trend: stats.pendingApprovals > 0 ? "alert" : "normal",
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions,
      icon: CalendarCheck,
      color: "text-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      change: "+8%",
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className={`border-0 shadow-sm ${stat.bg}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    {stat.trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                    <span
                      className={`text-xs font-medium ${
                        stat.trend === "up"
                          ? "text-green-600"
                          : stat.trend === "alert"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 ${stat.iconBg} rounded-xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second Row - Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Online Now</p>
                  <p className="text-2xl font-bold">{stats.onlineUsers}</p>
                </div>
              </div>
            </div>
            <Progress value={(stats.onlineUsers / (stats.totalUsers || 1)) * 100} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {((stats.onlineUsers / (stats.totalUsers || 1)) * 100).toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Stories</p>
                  <p className="text-2xl font-bold">{stats.totalArticles}</p>
                </div>
              </div>
            </div>
            <Link href="/stories">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Manage Stories
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chat Rooms</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
              </div>
            </div>
            <Link href="/chats">
              <Button variant="outline" size="sm" className="w-full gap-2">
                View Chats
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  Recent Users
                </CardTitle>
                <CardDescription>Latest users who joined the platform</CardDescription>
              </div>
              <Link href="/users">
                <Button variant="outline" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No users yet</p>
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-medium">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName || "No Name"}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={user.role === "counsellor" ? "default" : user.role === "admin" ? "destructive" : "secondary"}
                        className={
                          user.role === "counsellor"
                            ? "bg-teal-100 text-teal-700 hover:bg-teal-100"
                            : user.role === "admin"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                            : ""
                        }
                      >
                        {user.role}
                      </Badge>
                      <span className="text-sm text-gray-500 hidden sm:block">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>Counsellors awaiting verification</CardDescription>
              </div>
              {stats.pendingApprovals > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {stats.pendingApprovals} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingCounsellors.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-green-300" />
                <p className="text-gray-500">All caught up!</p>
                <p className="text-sm text-gray-400">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCounsellors.map((counsellor) => (
                  <div
                    key={counsellor.id}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={counsellor.photoURL} />
                      <AvatarFallback className="bg-amber-200 text-amber-700">
                        {getInitials(counsellor.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {counsellor.displayName || "No Name"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{counsellor.email}</p>
                    </div>
                  </div>
                ))}
                <Link href="/approvals">
                  <Button className="w-full mt-2 bg-teal-600 hover:bg-teal-700">
                    Review All Approvals
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/users">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link href="/stories">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <BookOpen className="w-6 h-6 text-green-600" />
                <span>Create Story</span>
              </Button>
            </Link>
            <Link href="/approvals">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                <span>Approvals</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <span>Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
