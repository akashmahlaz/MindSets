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
      const q = query(
        counsellorsRef,
        where('role', '==', 'counsellor'),
        where('verificationStatus', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const applications: CounsellorApplication[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as CounsellorProfileData;
        applications.push({
          uid: doc.id,
          profileData: data,
          submittedAt: data.createdAt,
          status: 'pending'
        });
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
      const q = query(
        counsellorsRef,
        where('role', '==', 'counsellor'),
        orderBy('createdAt', 'desc')
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
}
