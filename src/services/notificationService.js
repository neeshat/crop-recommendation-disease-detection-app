import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function createNotification(userId, title, message, type) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  await addDoc(collection(db, "notifications"), {
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
}
