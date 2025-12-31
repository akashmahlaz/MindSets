import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(userId);
      console.log(`✅ Deleted user from Firebase Auth: ${userId}`);
    } catch (authError: unknown) {
      // User might not exist in Auth (e.g., if they signed up differently)
      const error = authError as { code?: string };
      if (error.code !== "auth/user-not-found") {
        console.error("Error deleting from Auth:", authError);
        throw authError;
      }
      console.log(`⚠️ User not found in Firebase Auth: ${userId}`);
    }

    // Delete from Firestore
    try {
      await adminDb.collection("users").doc(userId).delete();
      console.log(`✅ Deleted user from Firestore: ${userId}`);
    } catch (firestoreError) {
      console.error("Error deleting from Firestore:", firestoreError);
      throw firestoreError;
    }

    return NextResponse.json({
      success: true,
      message: "User deleted from both Authentication and Database",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// Bulk delete users
export async function POST(request: NextRequest) {
  try {
    const { userIds, action } = await request.json();

    if (action !== "bulk-delete" || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    for (const userId of userIds) {
      try {
        // Delete from Firebase Auth
        try {
          await adminAuth.deleteUser(userId);
        } catch (authError: unknown) {
          const error = authError as { code?: string };
          if (error.code !== "auth/user-not-found") {
            throw authError;
          }
        }

        // Delete from Firestore
        await adminDb.collection("users").doc(userId).delete();
        
        results.success.push(userId);
      } catch {
        results.failed.push(userId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${results.success.length} users, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return NextResponse.json(
      { error: "Failed to process bulk delete" },
      { status: 500 }
    );
  }
}
