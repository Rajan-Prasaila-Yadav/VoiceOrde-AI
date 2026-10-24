"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type RoleMode = "CUSTOMER" | "ADMIN";

interface RoleContextType {
  user: any;
  role: RoleMode;
  isAdmin: boolean;
  isCustomer: boolean;
  isAuthenticatedAdmin: boolean;
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  signOut: () => Promise<void>;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  user: null,
  role: "CUSTOMER",
  isAdmin: false,
  isCustomer: true,
  isAuthenticatedAdmin: false,
  showAdminModal: false,
  setShowAdminModal: () => {},
  signOut: async () => {},
  loading: true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<RoleMode>("CUSTOMER");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Checks whether the user is explicitly authenticated as Storekeeper Admin
  const checkAdminToken = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("voiceorder_admin_token");
      const storedRole = localStorage.getItem("voiceorder_user_role");
      return Boolean(token && storedRole === "ADMIN");
    }
    return false;
  };

  useEffect(() => {
    // 1. Initial auth check
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user ?? null;
      setUser(currentUser);

      // Google Sign-In users are Customers. Storekeeper is authenticated via admin token.
      const hasAdminToken = checkAdminToken();
      if (hasAdminToken) {
        setRole("ADMIN");
      } else {
        setRole("CUSTOMER");
      }
      setLoading(false);
    });

    // 2. Auth listener for real-time sign in/out
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      const hasAdminToken = checkAdminToken();
      if (hasAdminToken) {
        setRole("ADMIN");
      } else {
        setRole("CUSTOMER");
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("voiceorder_admin_token");
      localStorage.removeItem("voiceorder_user_role");
      localStorage.removeItem("voiceorder_view_mode");
    }
    setUser(null);
    setRole("CUSTOMER");
  };

  const isAdmin = role === "ADMIN";
  const isCustomer = !isAdmin;

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isCustomer,
        isAuthenticatedAdmin: isAdmin,
        showAdminModal,
        setShowAdminModal,
        signOut,
        loading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
