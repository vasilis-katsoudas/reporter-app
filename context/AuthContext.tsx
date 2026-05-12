import { createUserWithEmailAndPassword, EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { User } from "../constants/types";
import { auth, db } from "../firebaseConfig";

//define the currently logged-in user
export type AuthUser = User & {
  safetyZones?: any[];
  lastLocation?: { latitude: number; longitude: number };
  following?: string[];
};

//define the available functions and data to the rest of the app
type AuthContextType = {
  isLoggedIn: boolean;
  user: AuthUser | null;
  authLoading: boolean;
  users: User[];
  following: string[];
  notifications: any[];
  login: (email: string, password: string) => Promise<string | null>;
  signup: (username: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateUser: (updatedUser: AuthUser, currentPassword?: string, newPassword?: string) => Promise<void>;
  deleteUser: (usernameToDelete: string) => void;  
  setUsers: React.Dispatch<React.SetStateAction<User[]>>; 
  followUser: (targetUserID: string, targetUsername: string) => void;
  markNotificationsAsRead: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  authLoading: true,
  users: [],
  following: [],
  notifications: [],
  login: async () => null,
  signup: async () => null,
  logout: () => {},
  updateUser: async () => {},
  deleteUser: () => {}, 
  setUsers: () => {},
  followUser: () => {},
  markNotificationsAsRead: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  //sync with the users collection in the database
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersList);
    });
    return () => unsubscribe();
  }, []);

  //monitor backend Auth state (login/logout) and set up real-time listeners for user data
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;
  
    //clean up old listeners before starting new ones
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (unsubNotifs) {
        unsubNotifs();
        unsubNotifs = null;
      }
  
      //listen for changes to the current user profile document
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              userID: firebaseUser.uid,
              username: userData.username,
              email: userData.email,
              joined: userData.joined,
              reputation: userData.reputation ?? 1,
              safetyZones: userData.safetyZones || [],
            });
            setFollowing(userData.following || []);
            setIsLoggedIn(true);
          }
          setAuthLoading(false); 
        });
  
        //listen for new notifications in the user's notifications sub-collection
        const notifRef = collection(db, "users", firebaseUser.uid, "notifications");
        unsubNotifs = onSnapshot(query(notifRef), (snapshot) => {
          const notifList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNotifications(notifList.sort((a: any, b: any) => 
            new Date(b.time).getTime() - new Date(a.time).getTime()
          ));
        });
  
      } else {
        //reset state if no user is authenticated
          setUser(null);
          setFollowing([]);
          setNotifications([]);
          setIsLoggedIn(false);
          setAuthLoading(false); 
      }
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  //update follow lists and send a notification to the person being followed
  const followUser = async (targetUserID: string, targetUsername: string) => {
    if (!user) return;

    const userRef = doc(db, "users", user.userID);
    const isFollowing = following.includes(targetUserID);
    const updatedFollowing = isFollowing 
      ? following.filter(id => id !== targetUserID)
      : [...following, targetUserID];

    try {
      await updateDoc(userRef, { following: updatedFollowing });

      //only send a notification if follow is added not removed
      if (!isFollowing) {
        const targetNotifRef = collection(db, "users", targetUserID, "notifications");
        await addDoc(targetNotifRef, {
          type: 'follow',
          recipientID: targetUserID,
          fromUser: user.username,
          fromUserID: user.userID,
          message: `${user.username} started following you!`,
          time: new Date().toISOString(),
          read: false
        });
      }
    } catch (e) {
      console.error("Follow error:", e);
    }
  };

  //create a new account in Firebase Auth and initialize their Firestore profile document
  const signup = async (username: string, email: string, password: string) => {
    try {
      const usernameQuery = query(collection(db, "users"), where("username", "==", username.trim()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        return "This username is already taken. Please choose another.";
      }
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = {
        userID: res.user.uid,
        username,
        email,
        joined: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        reputation: 1,
      };
      await setDoc(doc(db, "users", res.user.uid), newUser);
      return null;
    } catch (err: any) {
      return err.message;
    }
  };

  //login existing users
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (err: any) {
      return "Invalid email or password.";
    }
  };

  //update user info
  const updateUser = async (updatedUser: AuthUser, currentPassword?: string, newPassword?: string) => {
    if (!auth.currentUser || !user) return;
    try {
      const usernameChanged = updatedUser.username !== user.username;
      if (usernameChanged) {
        const usernameQuery = query(collection(db, "users"), where("username", "==", updatedUser.username.trim()));
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
          throw new Error("This username is already taken.");
        }
      }
      if (newPassword) {
        if (!currentPassword) {
          throw new Error("Current password is required to set a new password.");
        }
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      }
      const userRef = doc(db, "users", user.userID);
      await updateDoc(userRef, {
        username: updatedUser.username.trim(),
        email: updatedUser.email,
      });
      setUser(updatedUser);
    } catch (e: any) {
      console.error("Auth Update Error:", e);
      throw e;
    }
  };

  //mark notifications as read when opening the screen
  const markNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadNotifs = notifications.filter(n => n.read === false);
      
      const promises = unreadNotifs.map(notif => {
        const notifRef = doc(db, "users", user.userID, "notifications", notif.id);
        return updateDoc(notifRef, { read: true });
      });
  
      await Promise.all(promises);
    } catch (e) {
      console.error("Error clearing notifications:", e);
    }
  };

  //permanently delete the Firestore user document and log the user out
  const deleteUser = async (userID: string) => {
    try {
      await deleteDoc(doc(db, "users", userID));
      logout();
    } catch (e) {
      console.error("Error deleting user:", e);
    }
  };

  //logout from Firebase Auth
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); 
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, login, authLoading, signup, logout, updateUser, deleteUser, users, setUsers, following, 
        notifications, markNotificationsAsRead,
        followUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}