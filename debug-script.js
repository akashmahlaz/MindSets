// Debug script to check and fix counsellor verification status
// Run this in your app to see current counsellors and fix any issues

export const debugCounsellors = async () => {
  try {
    console.log("🔧 Starting counsellor verification debug...");

    // Import the necessary functions
    const {
      getCounsellors,
      debugCounsellorsVerification,
      fixTestCounsellors,
    } = require("./services/userService");

    // Step 1: Check current counsellors verification status
    console.log("1️⃣ Checking current counsellors verification status:");
    await debugCounsellorsVerification();

    // Step 2: Get counsellors that would show in the app
    console.log("2️⃣ Getting counsellors that show in app:");
    const visibleCounsellors = await getCounsellors();
    console.log(`📱 Counsellors visible in app: ${visibleCounsellors.length}`);
    visibleCounsellors.forEach(c => {
      console.log(`✅ Visible: ${c.displayName} (verified: ${c.isApproved && c.verificationStatus === 'verified'})`);
    });

    // Step 3: Fix auto-approved test counsellors
    console.log("3️⃣ Fixing auto-approved test counsellors:");
    await fixTestCounsellors();

    // Step 4: Verify the fix
    console.log("4️⃣ Verification status after fix:");
    await debugCounsellorsVerification();

    // Step 5: Check visible counsellors after fix
    console.log("5️⃣ Counsellors visible in app after fix:");
    const fixedVisibleCounsellors = await getCounsellors();
    console.log(`📱 Counsellors visible in app after fix: ${fixedVisibleCounsellors.length}`);
    fixedVisibleCounsellors.forEach(c => {
      console.log(`✅ Still visible: ${c.displayName} (verified: ${c.isApproved && c.verificationStatus === 'verified'})`);
    });
    const allCounsellors = await getCounsellors();
    console.log("All counsellors:", allCounsellors.length);
    allCounsellors.forEach((counsellor, index) => {
      console.log(`Counsellor ${index + 1}:`, {
        name: counsellor.displayName,
        email: counsellor.email,
        role: counsellor.role,
        approved: counsellor.isApproved,
        specializations: counsellor.specializations || "none",
      });
    });

    // Try with filters
    console.log("3️⃣ Getting counsellors with anxiety filter:");
    const anxietyCounsellors = await getCounsellors({
      specializations: ["Anxiety"],
    });
    console.log("Anxiety counsellors:", anxietyCounsellors.length);

    return {
      total: allCounsellors.length,
      withAnxiety: anxietyCounsellors.length,
    };
  } catch (error) {
    console.error("🚨 Debug script error:", error);
    return { error: error.message };
  }
};

// You can call this function from your UserDashboard to debug
// Just add: await debugCounsellors();
