import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AdminService } from "@/services/adminService";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface User {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'counsellor' | 'admin';
  status?: 'online' | 'offline' | 'away';
  createdAt?: any;
  isActive?: boolean;
  isDeleted?: boolean;
  verificationStatus?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'user' | 'counsellor' | 'admin'>('all');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { user: currentUser } = useAuth();
  const loadUsers = async () => {
    try {
      const allUsers = await AdminService.getAllUsers();
      setUsers(allUsers.filter(u => !u.isDeleted)); // Don't show deleted users
    } catch (loadError) {
      console.error('Error loading users:', loadError);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadUsers();
      return;
    }
    
    try {
      setLoading(true);
      const searchResults = await AdminService.searchUsers(searchTerm);
      setUsers(searchResults.filter(u => !u.isDeleted));
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'counsellor' | 'admin') => {
    if (!currentUser?.uid) return;
    
    Alert.alert(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Role',
          onPress: async () => {
            try {
              setProcessingIds(prev => new Set(prev).add(userId));
              await AdminService.updateUserRole(userId, newRole, currentUser.uid);
              Alert.alert('Success', 'User role updated successfully');
              loadUsers();
            } catch (error) {
              console.error('Role change error:', error);
              Alert.alert('Error', 'Failed to update user role');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    if (!currentUser?.uid) return;
    
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} this user account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus ? 'default' : 'destructive',
          onPress: () => {
            if (!newStatus) {
              // If deactivating, ask for reason
              Alert.alert(
                'Deactivation Reason',
                'Please select a reason:',
                [
                  { text: 'Violation of terms', onPress: () => executeStatusChange(userId, newStatus, 'Violation of terms') },
                  { text: 'Spam/abuse', onPress: () => executeStatusChange(userId, newStatus, 'Spam/abuse') },
                  { text: 'Inactive account', onPress: () => executeStatusChange(userId, newStatus, 'Inactive account') },
                  { text: 'User request', onPress: () => executeStatusChange(userId, newStatus, 'User request') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            } else {
              executeStatusChange(userId, newStatus);
            }
          }
        }
      ]
    );
  };

  const executeStatusChange = async (userId: string, isActive: boolean, reason?: string) => {
    if (!currentUser?.uid) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(userId));
      await AdminService.updateUserStatus(userId, isActive, currentUser.uid, reason);
      Alert.alert('Success', `User ${isActive ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Error', 'Failed to update user status');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser?.uid) return;
    
    Alert.alert(
      'Delete User',
      'This will permanently deactivate the user account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Deletion Reason',
              'Please select a reason:',
              [
                { text: 'Serious violation', onPress: () => executeDelete(userId, 'Serious violation of terms') },
                { text: 'Fraudulent account', onPress: () => executeDelete(userId, 'Fraudulent account') },
                { text: 'Legal request', onPress: () => executeDelete(userId, 'Legal request') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        }
      ]
    );
  };

  const executeDelete = async (userId: string, reason: string) => {
    if (!currentUser?.uid) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(userId));
      await AdminService.deleteUser(userId, currentUser.uid, reason);
      Alert.alert('Success', 'User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  }).filter(user => user.role); // Only show users with defined roles
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'counsellor': return 'bg-blue-500';
      case 'user': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  const getStatusColor = (isActive: boolean | undefined) => {
    return isActive !== false ? 'bg-green-500' : 'bg-red-500';
  };

  const FilterButton = ({ value, label }: { value: typeof filter, label: string }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      className={`px-4 py-2 rounded-full border ${
        filter === value 
          ? 'bg-primary border-primary' 
          : 'bg-background border-border'
      }`}
    >
      <Text className={`text-sm ${
        filter === value ? 'text-primary-foreground' : 'text-foreground'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-muted-foreground">Loading users...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          User Management
        </Text>
        <Text className="text-muted-foreground mb-4">
          Manage all users and their roles
        </Text>

        {/* Search Bar */}
        <View className="flex-row mb-4 space-x-2">
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search by name, email, or role..."
            className="flex-1 h-10 px-3 border border-border rounded-lg bg-background text-foreground"
            placeholderTextColor="#9CA3AF"
          />
          <Button onPress={handleSearch} className="px-4">
            <Text className="text-primary-foreground">Search</Text>
          </Button>
        </View>

        {/* Filter Buttons */}
        <View className="flex-row space-x-2 mb-4">
          <FilterButton value="all" label={`All (${users.length})`} />
          <FilterButton value="user" label="Users" />
          <FilterButton value="counsellor" label="Counsellors" />
          <FilterButton value="admin" label="Admins" />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <Text className="text-center text-muted-foreground">
                No users found
              </Text>
            </CardContent>          </Card>
        ) : (
          filteredUsers.map((user) => {
            // Safety check - only render users with required fields
            if (!user.uid || !user.email || !user.role) {
              return null;
            }
              return (
              <Card key={user.uid} className="mb-4">
                <CardHeader>
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <CardTitle className="text-lg">
                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                      </CardTitle>
                      <Text className="text-muted-foreground">
                        {user.email}
                      </Text>
                    </View>
                    <View className="flex-row space-x-2">
                      <Badge className={`${getRoleColor(user.role)} border-0`}>
                        <Text className="text-white text-xs">
                          {(user.role || 'unknown').toUpperCase()}
                        </Text>
                      </Badge>
                      <Badge className={`${getStatusColor(user.isActive)} border-0`}>
                        <Text className="text-white text-xs">
                          {user.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </Badge>
                    </View>
                  </View>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* User Info */}
                  <View>
                    <Text className="text-sm text-muted-foreground">
                      ID: {user.uid}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Joined: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Status: {user.status || 'offline'}
                    </Text>
                    {user.role === 'counsellor' && user.verificationStatus && (
                      <Text className="text-sm text-muted-foreground">
                        Verification: {user.verificationStatus}
                      </Text>
                    )}
                  </View>

                  {/* Role Management */}
                  <View>
                    <Text className="font-semibold text-foreground mb-2">Change Role</Text>
                    <View className="flex-row space-x-2">
                      {['user', 'counsellor', 'admin'].map((role) => (
                        <Button
                          key={role}
                          variant={user.role === role ? "default" : "outline"}
                          onPress={() => handleRoleChange(user.uid, role as any)}
                          disabled={user.role === role || processingIds.has(user.uid)}
                          className="flex-1"
                        >
                          <Text className={user.role === role ? "text-primary-foreground" : "text-foreground"}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row space-x-2">
                    <Button
                      onPress={() => handleStatusToggle(user.uid, user.isActive !== false)}
                      variant={user.isActive !== false ? "destructive" : "default"}
                      className="flex-1"
                      disabled={processingIds.has(user.uid)}
                    >
                      <Text className="text-white">
                        {processingIds.has(user.uid) 
                          ? 'Processing...' 
                          : user.isActive !== false ? 'Deactivate' : 'Activate'
                        }
                      </Text>
                    </Button>
                    <Button
                      onPress={() => handleDeleteUser(user.uid)}
                      variant="destructive"
                      className="flex-1"
                      disabled={processingIds.has(user.uid)}
                    >
                      <Text className="text-white">Delete</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
