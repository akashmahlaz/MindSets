"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { getInitials } from "@/lib/utils";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { CheckCircle, Clock, Eye, Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface Counsellor {
  id: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  licenseType?: string;
  licenseNumber?: string;
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
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (counsellorId: string, status: "verified" | "rejected", notes?: string) => {
    try {
      await updateDoc(doc(db, "users", counsellorId), {
        verificationStatus: status,
        verificationNotes: notes || "",
        verifiedAt: new Date(),
      });
      await fetchCounsellors();
      setSelectedCounsellor(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredCounsellors = counsellors.filter((c) => {
    const matchesSearch =
      c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || c.verificationStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search counsellors..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v: string) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Counsellors List */}
      <div className="grid gap-4">
        {filteredCounsellors.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No counsellors found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCounsellors.map((counsellor) => (
            <Card key={counsellor.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-lg">
                        {getInitials(counsellor.displayName)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{counsellor.displayName}</h3>
                        {getStatusBadge(counsellor.verificationStatus)}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{counsellor.email}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {counsellor.licenseType && (
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                            {counsellor.licenseType}
                          </span>
                        )}
                        {counsellor.yearsExperience && (
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                            {counsellor.yearsExperience} years exp.
                          </span>
                        )}
                        {counsellor.hourlyRate && (
                          <span className="px-2 py-1 bg-green-100 rounded-md text-green-700">
                            ${counsellor.hourlyRate}/hr
                          </span>
                        )}
                      </div>
                      {counsellor.specializations && counsellor.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {counsellor.specializations.map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCounsellor(counsellor)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {counsellor.verificationStatus === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => updateStatus(counsellor.id, "verified")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => updateStatus(counsellor.id, "rejected")}
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

      {/* Detail Modal */}
      {selectedCounsellor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Counsellor Details</h2>
                <Button variant="ghost" onClick={() => setSelectedCounsellor(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-xl">
                      {getInitials(selectedCounsellor.displayName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedCounsellor.displayName}</h3>
                    <p className="text-gray-500">{selectedCounsellor.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">License Type</p>
                    <p className="font-medium">{selectedCounsellor.licenseType || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">License Number</p>
                    <p className="font-medium">{selectedCounsellor.licenseNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">{selectedCounsellor.yearsExperience || 0} years</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="font-medium">${selectedCounsellor.hourlyRate || 0}/hr</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCounsellor.specializations?.map((spec, i) => (
                      <Badge key={i}>{spec}</Badge>
                    )) || <span className="text-gray-400">None specified</span>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedCounsellor.verificationStatus)}</div>
                </div>

                {selectedCounsellor.verificationStatus === "pending" && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatus(selectedCounsellor.id, "verified")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateStatus(selectedCounsellor.id, "rejected")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
