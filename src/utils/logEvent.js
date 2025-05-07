import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { auth } from "../config/firebaseConfig";

// Function to store user details locally when they log in
export const storeUserDetailsLocally = ({ userId, role, userName, ip }) => {
  localStorage.setItem("userDetails", JSON.stringify({ userId, role, userName, ip }));
};

// Function to log the event and store details in Firestore
export const logEvent = async ({ userId, role, userName, action, target, details, ip }) => {
  try {
    let resolvedUserName = userName;

    // Fetch user name from Firestore if it's not provided
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

// Function to handle logout, logging event and clearing local storage
export const handleLogout = async () => {
  try {
    // Get user details from localStorage
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (userDetails) {
      const { userId, role, userName, ip } = userDetails;

      // Log the logout event to Firestore
      await logEvent({
        userId,
        role,
        userName,
        action: "Logout",
        target: "N/A", // No specific target for logout
        details: "User logged out",
        ip,
      });

      // Clear user details from localStorage after logging out
      localStorage.removeItem("userDetails");

      // Proceed with the logout process
      await auth.signOut();
      console.log("User logged out successfully.");
    } else {
      console.warn("No user details found in localStorage.");
    }
  } catch (error) {
    console.error("Error during logout:", error.message);
  }
};
