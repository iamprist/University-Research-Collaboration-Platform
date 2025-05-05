import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { auth } from "../config/firebaseConfig";

// Store user details in localStorage
export const storeUserDetailsLocally = ({ userId, role, userName, ip }) => {
  localStorage.setItem("userDetails", JSON.stringify({ userId, role, userName, ip }));
};

// Log user activity to Firestore
export const logEvent = async ({ userId, role, userName, action, target, details, ip }) => {
  try {
    let resolvedUserName = userName;

    // Fetch user name if not provided
    if (!userName && userId) {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      resolvedUserName = userDoc.exists() ? userDoc.data().name : "N/A";
    }

    const logData = {
      userId: userId || "unknown",
      role: role || "unknown",
      userName: resolvedUserName || "unknown",
      action: action || "unspecified",
      target: target || "unspecified",
      details: details || "",
      ip: ip || "N/A",
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, "logs"), logData);
    console.log("Event logged successfully:", logData);

  } catch (error) {
    console.error("Error logging event:", error.message);
  }
};

// Logout handler
export const handleLogout = async () => {
  try {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));

    if (userDetails) {
      const { userId, role, userName, ip } = userDetails;

      await logEvent({
        userId,
        role,
        userName,
        action: "Logout",
        target: "N/A",
        details: "User logged out",
        ip,
      });

      localStorage.removeItem("userDetails");
      await auth.signOut();

      console.log("User logged out successfully.");
    } else {
      console.warn("No user details found in localStorage.");
    }

  } catch (error) {
    console.error("Error during logout:", error.message);
  }
};
