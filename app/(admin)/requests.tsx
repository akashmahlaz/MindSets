import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AdminService, CounsellorApplication } from "@/services/adminService";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminRequests() {  const [applications, setApplications] = useState<CounsellorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const { user } = useAuth();

  const loadApplications = async () => {
    try {
      const allApplications = await AdminService.getAllApplications();
      setApplications(allApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  useEffect(() => {
    loadApplications();
  }, []);
  const handleApprove = async (counsellorId: string) => {
    if (!user?.uid) return;
    
    Alert.alert(
      'Approve Application',
      'Are you sure you want to approve this counsellor application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setProcessingIds(prev => new Set(prev).add(counsellorId));
              await AdminService.approveCounsellor(counsellorId, user.uid);
              Alert.alert('Success', 'Counsellor approved successfully');
              loadApplications();            } catch (approveError) {
              console.error('Approve error:', approveError);
              Alert.alert('Error', 'Failed to approve counsellor');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(counsellorId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };
  const handleReject = async (counsellorId: string) => {
    if (!user?.uid) return;
    
    // Use a more reliable approach for getting rejection reason
    Alert.alert(
      'Reject Application',
      'This will reject the counsellor application. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => showRejectReasonDialog(counsellorId)
        }
      ]
    );
  };

  const showRejectReasonDialog = (counsellorId: string) => {
    // Common rejection reasons
    const reasons = [
      'Incomplete documentation',
      'Invalid license verification',
      'Insufficient experience',
      'Missing required certifications',
      'Application does not meet requirements',
      'Other (Custom reason)'
    ];

    Alert.alert(
      'Select Rejection Reason',
      'Choose a reason for rejection:',
      [
        ...reasons.slice(0, 5).map(reason => ({
          text: reason,
          onPress: () => executeReject(counsellorId, reason)
        })),
        {
          text: 'Other',
          onPress: () => {
            // For custom reason, we'll use a simpler approach
            executeReject(counsellorId, 'Application requires additional review. Please contact support for details.');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };
  const executeReject = async (counsellorId: string, reason: string) => {
    if (!user?.uid) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(counsellorId));
      await AdminService.rejectCounsellor(counsellorId, user.uid, reason);
      Alert.alert('Success', 'Application rejected successfully');
      loadApplications();
    } catch (error) {
      console.error('Reject error:', error);
      Alert.alert('Error', 'Failed to reject application. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(counsellorId);
        return newSet;
      });
    }
  };

  const handleViewDocument = async (documentUrl: string, documentName: string) => {
    try {
      // Open document in browser
      await Linking.openURL(documentUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-muted-foreground">Loading applications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          Counsellor Applications
        </Text>
        <Text className="text-muted-foreground mb-4">
          Review and manage counsellor verification requests
        </Text>

        {/* Filter Buttons */}
        <View className="flex-row space-x-2 mb-4">
          <FilterButton value="pending" label={`Pending (${applications.filter(a => a.status === 'pending').length})`} />
          <FilterButton value="approved" label="Approved" />
          <FilterButton value="rejected" label="Rejected" />
          <FilterButton value="all" label="All" />
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <Text className="text-center text-muted-foreground">
                No applications found for the selected filter
              </Text>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.uid} className="mb-4">
              <CardHeader>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <CardTitle className="text-lg">
                      {application.profileData.displayName}
                    </CardTitle>
                    <Text className="text-muted-foreground">
                      {application.profileData.email}
                    </Text>
                  </View>                  <Badge className={`${getStatusColor(application.status)} border-0`}>
                    <Text className="text-white text-xs">
                      {(application.status || 'unknown').toUpperCase()}
                    </Text>
                  </Badge>
                </View>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Professional Info */}
                <View>
                  <Text className="font-semibold text-foreground mb-2">Professional Information</Text>
                  <View className="space-y-1">
                    <Text className="text-sm text-muted-foreground">
                      License: {application.profileData.licenseType}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      License #: {application.profileData.licenseNumber}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Experience: {application.profileData.yearsExperience} years
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Rate: ${application.profileData.hourlyRate}/hour
                    </Text>
                  </View>
                </View>

                {/* Specializations */}
                <View>
                  <Text className="font-semibold text-foreground mb-2">Specializations</Text>
                  <View className="flex-row flex-wrap gap-1">
                    {application.profileData.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="outline">
                        <Text className="text-xs">{spec}</Text>
                      </Badge>
                    ))}
                    {application.profileData.specializations.length > 3 && (
                      <Badge variant="outline">
                        <Text className="text-xs">+{application.profileData.specializations.length - 3} more</Text>
                      </Badge>
                    )}
                  </View>
                </View>

                {/* Documents */}
                {application.profileData.verificationDocuments && (
                  <View>
                    <Text className="font-semibold text-foreground mb-2">Documents</Text>
                    <View className="space-y-2">
                      {Object.entries(application.profileData.verificationDocuments).map(([docType, doc]) => (
                        doc && (
                          <TouchableOpacity
                            key={docType}
                            onPress={() => handleViewDocument(doc.url, doc.name)}
                            className="flex-row justify-between items-center p-2 border border-border rounded"
                          >
                            <View>                              <Text className="text-sm font-medium text-foreground">
                                {(docType || '').charAt(0).toUpperCase() + (docType || '').slice(1)}
                              </Text>
                              <Text className="text-xs text-muted-foreground">{doc.name}</Text>
                            </View>
                            <Text className="text-primary text-sm">View</Text>
                          </TouchableOpacity>
                        )
                      ))}
                    </View>
                  </View>
                )}

                {/* Submission Date */}
                <Text className="text-xs text-muted-foreground">
                  Submitted: {application.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                </Text>

                {/* Admin Notes */}
                {application.adminNotes && (
                  <View className="bg-muted p-3 rounded">
                    <Text className="text-sm font-medium text-foreground mb-1">Admin Notes:</Text>
                    <Text className="text-sm text-muted-foreground">{application.adminNotes}</Text>
                  </View>
                )}                {/* Action Buttons */}
                {application.status === 'pending' && (
                  <View className="flex-row space-x-2 pt-2">
                    <Button
                      onPress={() => handleApprove(application.uid)}
                      className="flex-1 bg-green-600"
                      disabled={processingIds.has(application.uid)}
                    >
                      <Text className="text-white">
                        {processingIds.has(application.uid) ? 'Approving...' : 'Approve'}
                      </Text>
                    </Button>
                    <Button
                      onPress={() => handleReject(application.uid)}
                      variant="destructive"
                      className="flex-1"
                      disabled={processingIds.has(application.uid)}
                    >
                      <Text className="text-white">
                        {processingIds.has(application.uid) ? 'Rejecting...' : 'Reject'}
                      </Text>
                    </Button>
                  </View>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}