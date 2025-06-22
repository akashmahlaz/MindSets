import { db, storage } from '@/firebaseConfig';
import {
    CounsellorDocuments,
    CounsellorProfileData,
    DocumentFile
} from '@/types/user';
import * as DocumentPicker from 'expo-document-picker';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes
} from 'firebase/storage';

export interface CounsellorApplication {
  uid: string;
  profileData: CounsellorProfileData;
  submittedAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
}

export class AdminService {
  
  /**
   * Upload document to Firebase Storage
   */
  static async uploadDocument(
    file: DocumentPicker.DocumentPickerAsset, 
    userId: string, 
    documentType: string
  ): Promise<DocumentFile> {
    try {
      // Read file as blob
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Create storage reference
      const fileName = `counsellors/${userId}/documents/${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        name: file.name,
        url: downloadURL,
        type: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
        uploadedAt: Timestamp.now()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Upload multiple documents for counsellor
   */
  static async uploadCounsellorDocuments(
    documents: { [key: string]: DocumentPicker.DocumentPickerAsset },
    userId: string
  ): Promise<CounsellorDocuments> {
    const uploadedDocs: CounsellorDocuments = {};
    
    for (const [docType, file] of Object.entries(documents)) {
      if (file) {
        uploadedDocs[docType as keyof CounsellorDocuments] = 
          await this.uploadDocument(file, userId, docType);
      }
    }
    
    return uploadedDocs;
  }
  /**
   * Get all pending counsellor applications
   */
  static async getPendingApplications(): Promise<CounsellorApplication[]> {
    try {
      const counsellorsRef = collection(db, 'users');
      // Simplified query - filter by role only, then filter pending on client side
      const q = query(
        counsellorsRef,
        where('role', '==', 'counsellor')
      );
      
      const snapshot = await getDocs(q);
      const applications: CounsellorApplication[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as CounsellorProfileData;
        // Filter for pending applications on client side
        if (data.verificationStatus === 'pending') {
          applications.push({
            uid: doc.id,
            profileData: data,
            submittedAt: data.createdAt,
            status: 'pending'
          });
        }
      });
      
      // Sort by creation date (newest first) on client side
      applications.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return applications;
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }
  /**
   * Get all counsellor applications (all statuses)
   */
  static async getAllApplications(): Promise<CounsellorApplication[]> {
    try {
      const counsellorsRef = collection(db, 'users');
      // Simplified query - filter by role only
      const q = query(
        counsellorsRef,
        where('role', '==', 'counsellor')
      );
      
      const snapshot = await getDocs(q);
      const applications: CounsellorApplication[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as CounsellorProfileData;
        applications.push({
          uid: doc.id,
          profileData: data,
          submittedAt: data.createdAt,
          status: data.verificationStatus as 'pending' | 'approved' | 'rejected',
          adminNotes: data.verificationNotes,
          reviewedBy: data.verifiedBy,
          reviewedAt: data.verifiedAt
        });
      });
      
      // Sort by creation date (newest first) on client side
      applications.sort((a, b) => {
        const dateA = a.submittedAt?.toDate?.() || new Date(0);
        const dateB = b.submittedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return applications;
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw new Error('Failed to fetch applications');
    }
  }

  /**
   * Get counsellor application by ID
   */
  static async getCounsellorApplication(uid: string): Promise<CounsellorApplication | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data() as CounsellorProfileData;
      
      return {
        uid: docSnap.id,
        profileData: data,
        submittedAt: data.createdAt,
        status: data.verificationStatus as 'pending' | 'approved' | 'rejected',
        adminNotes: data.verificationNotes,
        reviewedBy: data.verifiedBy,
        reviewedAt: data.verifiedAt
      };
    } catch (error) {
      console.error('Error fetching counsellor application:', error);
      throw new Error('Failed to fetch application');
    }
  }

  /**
   * Approve counsellor application
   */
  static async approveCounsellor(
    counsellorId: string, 
    adminId: string, 
    notes?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update counsellor status
      const counsellorRef = doc(db, 'users', counsellorId);
      batch.update(counsellorRef, {
        verificationStatus: 'verified',
        isApproved: true,
        verificationNotes: notes || '',
        verifiedBy: adminId,
        verifiedAt: Timestamp.now()
      });
      
      // Create notification for counsellor
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        userId: counsellorId,
        type: 'approval',
        title: 'Application Approved!',
        message: 'Congratulations! Your counsellor application has been approved. You can now start accepting clients.',
        read: false,
        createdAt: Timestamp.now(),
        data: {
          type: 'counsellor_approval'
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error approving counsellor:', error);
      throw new Error('Failed to approve counsellor');
    }
  }

  /**
   * Reject counsellor application
   */
  static async rejectCounsellor(
    counsellorId: string, 
    adminId: string, 
    reason: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update counsellor status
      const counsellorRef = doc(db, 'users', counsellorId);
      batch.update(counsellorRef, {
        verificationStatus: 'rejected',
        isApproved: false,
        verificationNotes: reason,
        verifiedBy: adminId,
        verifiedAt: Timestamp.now()
      });
      
      // Create notification for counsellor
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        userId: counsellorId,
        type: 'rejection',
        title: 'Application Update',
        message: `Your counsellor application needs revision: ${reason}`,
        read: false,
        createdAt: Timestamp.now(),
        data: {
          type: 'counsellor_rejection',
          reason: reason
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error rejecting counsellor:', error);
      throw new Error('Failed to reject counsellor');
    }
  }

  /**
   * Download document from URL
   */
  static async downloadDocument(url: string, filename: string): Promise<void> {
    try {
      // For React Native, we'll open the URL in browser
      // In a web environment, this would trigger a download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  /**
   * Get admin statistics
   */
  static async getAdminStats(): Promise<{
    totalCounsellors: number;
    pendingApplications: number;
    approvedCounsellors: number;
    rejectedApplications: number;
    totalUsers: number;
  }> {
    try {
      const usersRef = collection(db, 'users');
      
      // Get all users
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      let totalUsers = 0;
      let totalCounsellors = 0;
      let pendingApplications = 0;
      let approvedCounsellors = 0;
      let rejectedApplications = 0;
      
      allUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        totalUsers++;
        
        if (data.role === 'counsellor') {
          totalCounsellors++;
          
          switch (data.verificationStatus) {
            case 'pending':
              pendingApplications++;
              break;
            case 'verified':
              approvedCounsellors++;
              break;
            case 'rejected':
              rejectedApplications++;
              break;
          }
        }
      });
      
      return {
        totalCounsellors,
        pendingApplications,
        approvedCounsellors,
        rejectedApplications,
        totalUsers
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch statistics');
    }
  }
  /**
   * Update counsellor documents in profile
   */
  static async updateCounsellorDocuments(
    counsellorId: string, 
    documents: CounsellorDocuments
  ): Promise<void> {
    try {
      const counsellorRef = doc(db, 'users', counsellorId);
      await updateDoc(counsellorRef, {
        verificationDocuments: documents,
        'profile.verificationDocuments': documents // Also update nested profile if exists
      });
    } catch (error) {
      console.error('Error updating counsellor documents:', error);
      throw new Error('Failed to update documents');
    }
  }
  /**
   * Delete document from storage
   */
  static async deleteDocument(documentUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, documentUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Get all users (for admin management)
   */
  static async getAllUsers(): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const users: any[] = [];
      snapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      // Fallback to simple query if ordering fails
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users: any[] = [];
        snapshot.forEach((doc) => {
          users.push({
            uid: doc.id,
            ...doc.data()
          });
        });
        return users;
      } catch (fallbackError) {
        throw new Error('Failed to fetch users');
      }
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(
    userId: string, 
    newRole: 'user' | 'counsellor' | 'admin',
    adminId: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const updates: any = {
        role: newRole,
        updatedBy: adminId,
        updatedAt: Timestamp.now()
      };

      // If changing to counsellor, set initial verification status
      if (newRole === 'counsellor') {
        updates.verificationStatus = 'pending';
        updates.isApproved = false;
      }

      // If changing from counsellor, remove counsellor-specific fields
      if (newRole !== 'counsellor') {
        updates.verificationStatus = null;
        updates.isApproved = null;
        updates.verificationDocuments = null;
        updates.verificationNotes = null;
      }

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Update user status (active/inactive)
   */
  static async updateUserStatus(
    userId: string, 
    isActive: boolean,
    adminId: string,
    reason?: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: isActive,
        statusUpdatedBy: adminId,
        statusUpdatedAt: Timestamp.now(),
        statusReason: reason || '',
        // If deactivating, also set offline status
        ...(isActive ? {} : { status: 'offline' })
      });

      // Create notification for user
      const notificationRef = doc(collection(db, 'notifications'));
      await updateDoc(notificationRef, {
        userId: userId,
        type: isActive ? 'account_activated' : 'account_deactivated',
        title: isActive ? 'Account Activated' : 'Account Deactivated',
        message: isActive 
          ? 'Your account has been activated and you can now use the platform.'
          : `Your account has been deactivated. ${reason ? `Reason: ${reason}` : 'Contact support for more information.'}`,
        read: false,
        createdAt: Timestamp.now(),
        data: {
          type: isActive ? 'activation' : 'deactivation',
          reason: reason || ''
        }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  /**
   * Delete user account (soft delete)
   */
  static async deleteUser(
    userId: string, 
    adminId: string,
    reason: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isDeleted: true,
        deletedBy: adminId,
        deletedAt: Timestamp.now(),
        deletionReason: reason,
        status: 'offline'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Search users by email, name, or role
   */
  static async searchUsers(searchTerm: string): Promise<any[]> {
    try {
      const allUsers = await this.getAllUsers();
      
      const searchLower = searchTerm.toLowerCase();
      return allUsers.filter(user => 
        user.email?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower) ||
        user.licenseNumber?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    usersByRole: { [key: string]: number };
  }> {
    try {
      const allUsers = await this.getAllUsers();
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let activeUsers = 0;
      let newUsersThisMonth = 0;
      const usersByRole: { [key: string]: number } = {};
      
      allUsers.forEach(user => {
        // Count active users (not deleted and not inactive)
        if (!user.isDeleted && user.isActive !== false) {
          activeUsers++;
        }
        
        // Count new users this month
        const createdAt = user.createdAt?.toDate?.() || new Date(0);
        if (createdAt >= startOfMonth) {
          newUsersThisMonth++;
        }
        
        // Count by role
        const role = user.role || 'unknown';
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });
      
      return {
        totalUsers: allUsers.length,
        activeUsers,
        inactiveUsers: allUsers.length - activeUsers,
        newUsersThisMonth,
        usersByRole
      };
    } catch (error) {
      console.error('Error getting user activity stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }
}
