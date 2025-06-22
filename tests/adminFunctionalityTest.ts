/**
 * Test script for Admin functionality
 * Run this to test the admin system without UI
 */

import { AdminService } from '../services/adminService';

export async function testAdminFunctionality() {
  console.log('🔥 Testing Admin Functionality...');
  
  try {
    // Test 1: Get admin statistics
    console.log('\n📊 Testing Admin Statistics...');
    const stats = await AdminService.getAdminStats();
    console.log('Stats:', {
      totalUsers: stats.totalUsers,
      totalCounsellors: stats.totalCounsellors,
      pendingApplications: stats.pendingApplications,
      approvedCounsellors: stats.approvedCounsellors,
      rejectedApplications: stats.rejectedApplications
    });
    
    // Test 2: Get all applications
    console.log('\n📋 Testing Get All Applications...');
    const allApplications = await AdminService.getAllApplications();
    console.log(`Found ${allApplications.length} total applications`);
    
    // Test 3: Get pending applications
    console.log('\n⏳ Testing Get Pending Applications...');
    const pendingApplications = await AdminService.getPendingApplications();
    console.log(`Found ${pendingApplications.length} pending applications`);
    
    // Show sample data
    if (allApplications.length > 0) {
      console.log('\n📄 Sample Application:');
      const sample = allApplications[0];
      console.log({
        name: sample.profileData.displayName,
        email: sample.profileData.email,
        status: sample.status,
        license: sample.profileData.licenseType,
        experience: sample.profileData.yearsExperience,
        specializations: sample.profileData.specializations?.slice(0, 3),
        hasDocuments: !!sample.profileData.verificationDocuments
      });
    }
    
    console.log('\n✅ Admin functionality test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Admin functionality test failed:', error);
    return false;
  }
}

// Instructions for manual testing
export const testInstructions = `
🧪 MANUAL TESTING INSTRUCTIONS:

1. **Test Counsellor Signup with Documents:**
   - Go to /(auth)/sign-up-counsellor
   - Fill out all 5 steps
   - Upload documents in step 5 (use PDF or images)
   - Submit application

2. **Test Admin Dashboard:**
   - Go to /(admin)/index
   - Check if statistics load correctly
   - Verify pending applications counter

3. **Test Admin Requests Page:**
   - Go to /(admin)/requests
   - Should see your test counsellor application
   - Try filtering by different statuses
   - Click on documents to view them
   - Try approving/rejecting applications

4. **Firebase Setup Required:**
   - Deploy Firestore rules: firebase deploy --only firestore:rules
   - The index error is fixed by using client-side filtering
   - Storage bucket should be configured for document uploads

5. **Test Document Upload:**
   - During counsellor signup, try uploading:
     - License document (required)
     - Degree certificate (required)  
     - Additional certifications (optional)
     - Malpractice insurance (optional)

✅ Expected Results:
- Documents upload to Firebase Storage
- Counsellor profile gets verification status "pending"
- Admin can see application in requests page
- Admin can view uploaded documents
- Admin can approve/reject with notes
- Counsellor gets notification of decision
`;
