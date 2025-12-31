"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { formatDate, getInitials } from "@/lib/utils";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Crown,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  User as UserIcon,
  UserMinus,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  uid?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoURL?: string;
  role: "user" | "counsellor" | "admin";
  status?: "online" | "offline" | "suspended";
  disabled?: boolean;
  primaryConcerns?: string[];
  createdAt?: { toDate?: () => Date } | Date;
  lastSeen?: { toDate?: () => Date } | Date;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "counsellor" | "admin">("all");
  const [stats, setStats] = useState({
    total: 0,
    users: 0,
    counsellors: 0,
    admins: 0,
    online: 0,
  });

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"delete" | "disable" | "enable" | "role" | null>(null);
  const [bulkRole, setBulkRole] = useState<"user" | "counsellor" | "admin">("user");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(data);
      setSelectedIds(new Set()); // Clear selection on refresh
      
      // Calculate stats
      setStats({
        total: data.length,
        users: data.filter((u) => u.role === "user").length,
        counsellors: data.filter((u) => u.role === "counsellor").length,
        admins: data.filter((u) => u.role === "admin").length,
        online: data.filter((u) => u.status === "online").length,
      });
    } catch (_error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesFilter;
  });

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredUsers.length;

  // Bulk action handlers
  const handleBulkAction = (action: "delete" | "disable" | "enable" | "role") => {
    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      const selectedArray = Array.from(selectedIds);
      
      if (bulkAction === "delete") {
        for (const userId of selectedArray) {
          batch.delete(doc(db, "users", userId));
        }
        await batch.commit();
        toast.success(`Successfully deleted ${selectedArray.length} users`);
      } else if (bulkAction === "disable") {
        for (const userId of selectedArray) {
          batch.update(doc(db, "users", userId), {
            disabled: true,
            status: "suspended",
            updatedAt: Timestamp.now(),
          });
        }
        await batch.commit();
        toast.success(`Successfully disabled ${selectedArray.length} users`);
      } else if (bulkAction === "enable") {
        for (const userId of selectedArray) {
          batch.update(doc(db, "users", userId), {
            disabled: false,
            status: "offline",
            updatedAt: Timestamp.now(),
          });
        }
        await batch.commit();
        toast.success(`Successfully enabled ${selectedArray.length} users`);
      } else if (bulkAction === "role") {
        for (const userId of selectedArray) {
          batch.update(doc(db, "users", userId), {
            role: bulkRole,
            updatedAt: Timestamp.now(),
          });
        }
        await batch.commit();
        toast.success(`Changed role for ${selectedArray.length} users to ${bulkRole}`);
      }
      
      setBulkDialogOpen(false);
      setSelectedIds(new Set());
      await loadData();
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Failed to perform bulk action");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewSheetOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      const docRef = doc(db, "users", selectedUser.id);
      await updateDoc(docRef, {
        displayName: editForm.displayName,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        updatedAt: Timestamp.now(),
      });
      toast.success("User updated successfully");
      setEditDialogOpen(false);
      loadData();
    } catch (_error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "users", selectedUser.id));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success("User deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const docRef = doc(db, "users", user.id);
      await updateDoc(docRef, {
        disabled: !user.disabled,
        status: user.disabled ? "offline" : "suspended",
        updatedAt: Timestamp.now(),
      });
      toast.success(user.disabled ? "User enabled" : "User disabled");
      loadData();
    } catch (_error) {
      toast.error("Failed to update user status");
    }
  };

  const handleRoleChange = async (newRole: "user" | "counsellor" | "admin") => {
    if (!selectedUser) return;
    try {
      const docRef = doc(db, "users", selectedUser.id);
      await updateDoc(docRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
      toast.success(`User role changed to ${newRole}`);
      setRoleDialogOpen(false);
      loadData();
    } catch (_error) {
      toast.error("Failed to change user role");
    }
  };

  const getRoleBadge = (role: string, disabled?: boolean) => {
    if (disabled) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="w-3 h-3" />
          Suspended
        </Badge>
      );
    }
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 gap-1">
            <Crown className="w-3 h-3" />
            Admin
          </Badge>
        );
      case "counsellor":
        return (
          <Badge className="bg-teal-500/10 text-teal-600 border-teal-200 gap-1">
            <ShieldCheck className="w-3 h-3" />
            Counsellor
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <UserIcon className="w-3 h-3" />
            User
          </Badge>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === "online") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Online
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 gap-1">
        <UserMinus className="w-3 h-3" />
        Offline
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-linear-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-linear-to-br from-teal-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Counsellors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.counsellors}</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-linear-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-linear-to-br from-green-50 to-lime-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Online Now</p>
                <p className="text-3xl font-bold text-gray-900">{stats.online}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UserCog className="w-5 h-5 text-teal-600" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage all users, roles, and permissions
              </CardDescription>
            </div>
            <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-1">
                    <Filter className="w-3 h-3" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="user">Users</TabsTrigger>
                  <TabsTrigger value="counsellor">Counsellors</TabsTrigger>
                  <TabsTrigger value="admin">Admins</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                <span className="text-sm font-medium text-teal-700">
                  {selectedIds.size} user{selectedIds.size > 1 ? "s" : ""} selected
                </span>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("enable")}
                    className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    Enable
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("disable")}
                    className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Ban className="w-4 h-4" />
                    Disable
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("role")}
                    className="gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Shield className="w-4 h-4" />
                    Change Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("delete")}
                    className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
                <div className="ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-gray-500"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator className="mb-4" />

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={isSomeSelected ? "data-[state=checked]:bg-teal-600" : ""}
                    />
                  </TableHead>
                  <TableHead className="w-[280px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <UserX className="w-10 h-10 text-gray-300" />
                        <p>No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className={`hover:bg-gray-50/50 ${selectedIds.has(user.id) ? "bg-teal-50/50" : ""}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                          aria-label={`Select ${user.displayName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback className="bg-linear-to-br from-teal-400 to-teal-600 text-white font-medium">
                              {getInitials(user.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{user.displayName || "No Name"}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role, user.disabled)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                              {user.disabled ? (
                                <>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Enable User
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-2" />
                                  Disable User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkAction === "delete" && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {bulkAction === "disable" && <Ban className="w-5 h-5 text-amber-500" />}
              {bulkAction === "enable" && <UserPlus className="w-5 h-5 text-green-500" />}
              {bulkAction === "role" && <Shield className="w-5 h-5 text-purple-500" />}
              {bulkAction === "delete" && "Delete Users"}
              {bulkAction === "disable" && "Disable Users"}
              {bulkAction === "enable" && "Enable Users"}
              {bulkAction === "role" && "Change Role"}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === "delete" && `Are you sure you want to delete ${selectedIds.size} users? This action cannot be undone.`}
              {bulkAction === "disable" && `This will disable ${selectedIds.size} users. They won't be able to access the app.`}
              {bulkAction === "enable" && `This will enable ${selectedIds.size} users. They will regain access to the app.`}
              {bulkAction === "role" && `Change the role for ${selectedIds.size} selected users.`}
            </DialogDescription>
          </DialogHeader>
          
          {bulkAction === "role" && (
            <div className="py-4 space-y-3">
              <button
                onClick={() => setBulkRole("user")}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  bulkRole === "user" ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">User</p>
                    <p className="text-sm text-gray-500">Basic access</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setBulkRole("counsellor")}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  bulkRole === "counsellor" ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="font-medium">Counsellor</p>
                    <p className="text-sm text-gray-500">Can provide counselling</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setBulkRole("admin")}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  bulkRole === "admin" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-sm text-gray-500">Full admin access</p>
                  </div>
                </div>
              </button>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} disabled={isBulkProcessing}>
              Cancel
            </Button>
            <Button
              variant={bulkAction === "delete" ? "destructive" : "default"}
              onClick={executeBulkAction}
              disabled={isBulkProcessing}
              className={bulkAction !== "delete" ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {isBulkProcessing ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Sheet */}
      <Sheet open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Complete information about this user
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback className="bg-linear-to-br from-teal-400 to-teal-600 text-white text-xl font-bold">
                    {getInitials(selectedUser.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.displayName}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getRoleBadge(selectedUser.role, selectedUser.disabled)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">First Name</Label>
                  <p className="font-medium">{selectedUser.firstName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Last Name</Label>
                  <p className="font-medium">{selectedUser.lastName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Joined</Label>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Last Active</Label>
                  <p className="font-medium">{formatDate(selectedUser.lastSeen)}</p>
                </div>
              </div>

              {selectedUser.primaryConcerns && selectedUser.primaryConcerns.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-gray-500 mb-2 block">Primary Concerns</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.primaryConcerns.map((concern) => (
                        <Badge key={concern} variant="outline">
                          {concern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewSheetOpen(false);
                    handleEditUser(selectedUser);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewSheetOpen(false);
                    setRoleDialogOpen(true);
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Change Role
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Email cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                placeholder="Full display name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email (Read-only)</Label>
              <Input value={editForm.email} disabled className="bg-gray-50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-teal-600 hover:bg-teal-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback>{getInitials(selectedUser.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.displayName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Select a new role for this user. Admin users have full access.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback>{getInitials(selectedUser.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.displayName}</p>
                  <p className="text-sm text-gray-500">Current: {selectedUser.role}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleChange("user")}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedUser.role === "user"
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">User</p>
                      <p className="text-sm text-gray-500">Basic access to the app</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleChange("counsellor")}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedUser.role === "counsellor"
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="font-medium">Counsellor</p>
                      <p className="text-sm text-gray-500">Can provide counselling services</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleChange("admin")}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedUser.role === "admin"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-sm text-gray-500">Full access to admin panel</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
