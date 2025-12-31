"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { getInitials } from "@/lib/utils";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import {
  Award,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Counsellor {
  id: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  licenseType?: string;
  licenseNumber?: string;
  licenseDocument?: string;
  bio?: string;
  specializations?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNotes?: string;
  createdAt?: { toDate: () => Date };
}

export default function CounsellorApprovals() {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    fetchCounsellors();
  }, []);

  const fetchCounsellors = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "counsellor"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Counsellor[];
      setCounsellors(data);
    } catch (error) {
      console.error("Error fetching counsellors:", error);
      toast.error("Failed to load counsellors. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (counsellorId: string, status: "verified" | "rejected", notes?: string) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", counsellorId), {
        verificationStatus: status,
        verificationNotes: notes || "",
        verifiedAt: new Date(),
        isApproved: status === "verified" ? true : false,
      });
      await fetchCounsellors();
      setSelectedCounsellor(null);
      setShowRejectDialog(false);
      setRejectNotes("");
      if (status === "verified") {
        toast.success("Counsellor has been verified and can now accept clients.");
      } else {
        toast.error("Counsellor application has been rejected.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCounsellors = counsellors.filter((c) => {
    const matchesSearch =
      c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || c.verificationStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = counsellors.filter((c) => c.verificationStatus === "pending").length;
  const verifiedCount = counsellors.filter((c) => c.verificationStatus === "verified").length;
  const rejectedCount = counsellors.filter((c) => c.verificationStatus === "rejected").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Pending Review</p>
                <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Verified</p>
                <p className="text-3xl font-bold text-green-700">{verifiedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-3xl font-bold text-red-700">{rejectedCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={(v: string) => setFilter(v as typeof filter)}>
              <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  Pending
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Counsellors List */}
      <div className="space-y-4">
        {filteredCounsellors.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <UserCheck className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No counsellors found</h3>
              <p className="text-gray-500">
                {filter === "pending"
                  ? "No pending applications to review"
                  : "Try adjusting your search or filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCounsellors.map((counsellor) => (
            <Card
              key={counsellor.id}
              className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                counsellor.verificationStatus === "pending" ? "ring-2 ring-amber-200" : ""
              }`}
              onClick={() => setSelectedCounsellor(counsellor)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      <AvatarImage src={counsellor.photoURL} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold text-lg">
                        {getInitials(counsellor.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{counsellor.displayName || "No Name"}</h3>
                        {getStatusBadge(counsellor.verificationStatus)}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {counsellor.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {counsellor.licenseType && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            <Award className="w-3 h-3" />
                            {counsellor.licenseType}
                          </span>
                        )}
                        {counsellor.yearsExperience && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                            <Briefcase className="w-3 h-3" />
                            {counsellor.yearsExperience} years
                          </span>
                        )}
                        {counsellor.hourlyRate && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                            <DollarSign className="w-3 h-3" />
                            ${counsellor.hourlyRate}/hr
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-center">
                    {counsellor.verificationStatus === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(counsellor.id, "verified");
                          }}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCounsellor(counsellor);
                            setShowRejectDialog(true);
                          }}
                          disabled={isProcessing}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCounsellor && !showRejectDialog} onOpenChange={() => setSelectedCounsellor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCounsellor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                    <AvatarImage src={selectedCounsellor.photoURL} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold text-xl">
                      {getInitials(selectedCounsellor.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedCounsellor.displayName || "No Name"}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {selectedCounsellor.email}
                    </DialogDescription>
                    <div className="mt-2">{getStatusBadge(selectedCounsellor.verificationStatus)}</div>
                  </div>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                {/* Professional Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-0 bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Award className="w-4 h-4" />
                          <span className="text-xs">License Type</span>
                        </div>
                        <p className="font-medium">{selectedCounsellor.licenseType || "N/A"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">License Number</span>
                        </div>
                        <p className="font-medium">{selectedCounsellor.licenseNumber || "N/A"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Briefcase className="w-4 h-4" />
                          <span className="text-xs">Experience</span>
                        </div>
                        <p className="font-medium">{selectedCounsellor.yearsExperience || 0} years</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">Hourly Rate</span>
                        </div>
                        <p className="font-medium">${selectedCounsellor.hourlyRate || 0}/hr</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Bio */}
                {selectedCounsellor.bio && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h4>
                    <Card className="border-0 bg-gray-50">
                      <CardContent className="p-4">
                        <p className="text-gray-700">{selectedCounsellor.bio}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Specializations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCounsellor.specializations && selectedCounsellor.specializations.length > 0 ? (
                      selectedCounsellor.specializations.map((spec, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1">
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">None specified</span>
                    )}
                  </div>
                </div>

                {/* License Document */}
                {selectedCounsellor.licenseDocument && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      License Document
                    </h4>
                    <Button variant="outline" asChild>
                      <a href={selectedCounsellor.licenseDocument} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Document
                      </a>
                    </Button>
                  </div>
                )}

                {/* Rejection Notes */}
                {selectedCounsellor.verificationStatus === "rejected" && selectedCounsellor.verificationNotes && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">Rejection Reason</h4>
                    <Card className="border-0 bg-red-50 border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <p className="text-red-700">{selectedCounsellor.verificationNotes}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {selectedCounsellor.verificationStatus === "pending" && (
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setSelectedCounsellor(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => updateStatus(selectedCounsellor.id, "verified")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve Application
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this counsellor application. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Rejection Reason</Label>
              <Textarea
                id="reject-notes"
                placeholder="Enter the reason for rejection..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCounsellor && updateStatus(selectedCounsellor.id, "rejected", rejectNotes)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
