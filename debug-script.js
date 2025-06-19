// Debug script to test counsellors fetching
// You can run this script in the app to test database connectivity

export const debugCounsellors = async () => {
  try {
    console.log('🔧 Starting debug script...');
    
    // Import the necessary functions
    const { getCounsellors, debugUsersCollection } = require('./services/userService');
    
    // Debug the entire users collection
    console.log('1️⃣ Debugging users collection:');
    await debugUsersCollection();
    
    // Try to get all counsellors without filters
    console.log('2️⃣ Getting all counsellors:');
    const allCounsellors = await getCounsellors();
    console.log('All counsellors:', allCounsellors.length);
    allCounsellors.forEach((counsellor, index) => {
      console.log(`Counsellor ${index + 1}:`, {
        name: counsellor.displayName,
        email: counsellor.email,
        role: counsellor.role,
        approved: counsellor.isApproved,
        specializations: counsellor.specializations || 'none'
      });
    });
    
    // Try with filters
    console.log('3️⃣ Getting counsellors with anxiety filter:');
    const anxietyCounsellors = await getCounsellors({
      specializations: ['Anxiety']
    });
    console.log('Anxiety counsellors:', anxietyCounsellors.length);
    
    return {
      total: allCounsellors.length,
      withAnxiety: anxietyCounsellors.length
    };
  } catch (error) {
    console.error('🚨 Debug script error:', error);
    return { error: error.message };
  }
};

// You can call this function from your UserDashboard to debug
// Just add: await debugCounsellors();
