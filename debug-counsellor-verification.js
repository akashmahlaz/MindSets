// Debug script to check counsellor verification status
// Run this in your app to see the current state of counsellors

export const debugCounsellorVerification = async () => {
  try {
    const { collection, getDocs, query, where } = await import(
      "firebase/firestore"
    );
    const { db } = await import("../firebaseConfig");

    const counsellorsRef = collection(db, "users");
    const q = query(counsellorsRef, where("role", "==", "counsellor"));

    const snapshot = await getDocs(q);

    console.log("=== COUNSELLOR VERIFICATION DEBUG ===");
    console.log(`Total counsellors found: ${snapshot.size}`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Counsellor: ${data.displayName || data.email}`);
      console.log(`  - isApproved: ${data.isApproved}`);
      console.log(`  - verificationStatus: ${data.verificationStatus}`);
      console.log(
        `  - Will show in list: ${data.isApproved === true && data.verificationStatus === "verified"}`,
      );
      console.log("---");
    });

    console.log("=== END DEBUG ===");
  } catch (error) {
    console.error("Error debugging counsellor verification:", error);
  }
};

// Function to fix existing counsellors (run once to fix database)
export const fixExistingCounsellors = async () => {
  try {
    const { collection, getDocs, query, where, doc, updateDoc, writeBatch } =
      await import("firebase/firestore");
    const { db } = await import("../firebaseConfig");

    const counsellorsRef = collection(db, "users");
    const q = query(counsellorsRef, where("role", "==", "counsellor"));

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    console.log("Fixing existing counsellors...");
    let updateCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // If counsellor has old "approved" status, fix it
      if (data.verificationStatus === "approved") {
        const docRef = doc(db, "users", docSnap.id);
        batch.update(docRef, {
          verificationStatus: "verified",
        });
        updateCount++;
        console.log(
          `Fixed ${data.displayName || data.email}: approved -> verified`,
        );
      }

      // If counsellor doesn't have verification status, set to pending
      if (!data.verificationStatus) {
        const docRef = doc(db, "users", docSnap.id);
        batch.update(docRef, {
          verificationStatus: "pending",
          isApproved: false,
        });
        updateCount++;
        console.log(
          `Fixed ${data.displayName || data.email}: no status -> pending`,
        );
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Updated ${updateCount} counsellors`);
    } else {
      console.log("No counsellors needed fixing");
    }
  } catch (error) {
    console.error("Error fixing counsellors:", error);
  }
};
