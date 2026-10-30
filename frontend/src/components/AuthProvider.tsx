"use client";
import React, { createContext, useContext } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

interface AdaptedUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: AdaptedUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const user: AdaptedUser | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        user_metadata: {
          full_name: clerkUser.fullName || undefined,
          avatar_url: clerkUser.imageUrl || undefined,
        },
      }
    : null;

  const signOut = async () => {
    await clerkSignOut();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
