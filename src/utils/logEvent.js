import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

export const logEvent = async ({ userId, role, userName, action, target, details, ip }) => {
  try {
    let resolvedUserName = userName;

    // Fetch the user's name from Firestore if not provided
    if (!userName && userId) {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      resolvedUserName = userDoc.exists() ? userDoc.data().name : "N/A";
    }

    await addDoc(collection(db, "logs"), {
      userId,
      role,
      userName: resolvedUserName,
      action,
      target,
      details,
      ip,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging event:", error);
  }
};