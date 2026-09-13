import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../services/firebase";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [currentUser, setCurrentUser] =
    useState(null);

  const [userProfile, setUserProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  async function register(
    email,
    password,
    fullName,
    role
  ) {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user =
      userCredential.user;

    await updateProfile(user, {
      displayName: fullName,
    });

    await setDoc(
      doc(
        db,
        "users",
        user.uid
      ),
      {
        uid: user.uid,
        fullName,
        email: user.email,
        role,
        expertStatus:
          role ===
          "agricultural-expert"
            ? "pending"
            : "not-applicable",
        createdAt:
          serverTimestamp(),
      }
    );

    await sendEmailVerification(
      user
    );

    setCurrentUser(user);

    await loadUserProfile(user);

    return user;
  }

  async function login(
    email,
    password
  ) {
    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user =
      userCredential.user;

    await reload(user);

    setCurrentUser(user);

    if (!user.emailVerified) {
      await loadUserProfile(user);

      const error =
        new Error(
          "Your email address has not been verified yet."
        );

      error.code =
        "auth/email-not-verified";

      throw error;
    }

    await loadUserProfile(user);

    return user;
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) {
      const error =
        new Error(
          "No authenticated user is available."
        );

      error.code =
        "auth/no-current-user";

      throw error;
    }

    await sendEmailVerification(
      auth.currentUser
    );
  }

  async function refreshUser() {
    if (!auth.currentUser) {
      setCurrentUser(null);
      return null;
    }

    await reload(
      auth.currentUser
    );

    setCurrentUser(
      auth.currentUser
    );

    await loadUserProfile(
      auth.currentUser
    );

    return auth.currentUser;
  }

  async function logout() {
    await signOut(auth);
  }

  async function loadUserProfile(
    user
  ) {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userDocument =
      await getDoc(
        doc(
          db,
          "users",
          user.uid
        )
      );

    if (
      userDocument.exists()
    ) {
      setUserProfile(
        userDocument.data()
      );
    } else {
      setUserProfile(null);
    }
  }

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          setCurrentUser(user);

          try {
            await loadUserProfile(
              user
            );
          } catch (error) {
            console.error(
              "Failed to load user profile:",
              error
            );

            setUserProfile(null);
          } finally {
            setLoading(false);
          }
        }
      );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    resendVerificationEmail,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {!loading &&
        children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}