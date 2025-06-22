import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminService } from "@/services/adminService";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AdminStats {
  totalCounsellors: number;
  pendingApplications: number;
  approvedCounsellors: number;
  rejectedApplications: number;
  totalUsers: number;
}

export default function AdminIndex() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const adminStats = await AdminService.getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ title, value, color, onPress }: {
    title: string;
    value: number;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} className="flex-1 mx-1">
      <Card className={`${color} border-0`}>
        <CardContent className="p-4 items-center">
          <Text className="text-2xl font-bold text-white">{value}</Text>
          <Text className="text-sm text-white/80 text-center">{title}</Text>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</Text>
          <Text className="text-muted-foreground">Manage your MindConnect platform</Text>
        </View>

        {/* Quick Stats */}
        {loading ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <Text className="text-center text-muted-foreground">Loading statistics...</Text>
            </CardContent>
          </Card>
        ) : stats ? (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Overview</Text>
            <View className="flex-row mb-3">
              <StatCard 
                title="Total Users" 
                value={stats.totalUsers} 
                color="bg-blue-500" 
              />
              <StatCard 
                title="Total Counsellors" 
                value={stats.totalCounsellors} 
                color="bg-green-500" 
              />
            </View>
            <View className="flex-row">
              <StatCard 
                title="Pending Applications" 
                value={stats.pendingApplications} 
                color="bg-yellow-500"
                onPress={() => router.push("/(admin)/requests")}
              />
              <StatCard 
                title="Approved" 
                value={stats.approvedCounsellors} 
                color="bg-emerald-500" 
              />
              <StatCard 
                title="Rejected" 
                value={stats.rejectedApplications} 
                color="bg-red-500" 
              />
            </View>
          </View>
        ) : null}

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Quick Actions</Text>
          
          <Card className="mb-3">
            <CardHeader>
              <CardTitle><Text>Counsellor Management</Text></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onPress={() => router.push("/(admin)/requests")}
                className="w-full"
              >
                <Text className="text-primary-foreground">
                  Review Applications ({stats?.pendingApplications || 0} pending)
                </Text>
              </Button>
                <Button 
                variant="outline"
                onPress={() => router.push("/(admin)/requests")}
                className="w-full"
              >
                <Text className="text-foreground">Manage All Counsellors</Text>
              </Button>
            </CardContent>
          </Card>         
           <Card className="mb-3">
            <CardHeader>
              <CardTitle><Text>User Management</Text></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text className="text-muted-foreground text-center">
                Coming soon: User management features
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><Text>Reports & Analytics</Text></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Text className="text-muted-foreground text-center">
                Coming soon: Analytics and reporting features
              </Text>
            </CardContent>
          </Card>
        </View>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle><Text>Recent Activity</Text></CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-muted-foreground text-center">
              Recent activity tracking coming soon...
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}