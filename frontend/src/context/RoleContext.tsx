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
  viewMode: RoleMode;
  isAdmin: boolean;
  isCustomer: boolean;
  isAuthenticatedAdmin: boolean;
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  toggleRole: () => void;
  setViewMode: (mode: RoleMode) => void;
  signOut: () => Promise<void>;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  user: null,
  role: "CUSTOMER",
  viewMode: "CUSTOMER",
  isAdmin: false,
  isCustomer: true,
  isAuthenticatedAdmin: false,
  showAdminModal: false,
  setShowAdminModal: () => {},
  toggleRole: () => {},
  setViewMode: () => {},
  signOut: async () => {},
  loading: true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [viewMode, setViewModeState] = useState<RoleMode>("CUSTOMER");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkIsAdmin = (currentUser: any) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("voiceorder_admin_token");
      const storedRole = localStorage.getItem("voiceorder_user_role");
      if (token && storedRole === "ADMIN") return true;
    }
    if (!currentUser?.email) return false;
    return currentUser.email.toLowerCase() === "rajanprasaila@gmail.com";
  };

  useEffect(() => {
    // 1. Initial auth check
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      const adminStatus = checkIsAdmin(currentUser);
      setIsAuthenticatedAdmin(adminStatus);

      if (adminStatus) {
        // If authenticated admin, respect stored viewMode or default to ADMIN
        const storedView = localStorage.getItem("voiceorder_view_mode") as RoleMode | null;
        setViewModeState(storedView === "CUSTOMER" ? "CUSTOMER" : "ADMIN");
      } else {
        // Non-admin or unauthenticated visitor is ALWAYS CUSTOMER
        setViewModeState("CUSTOMER");
        localStorage.setItem("voiceorder_view_mode", "CUSTOMER");
      }
      setLoading(false);
    });

    // 2. Auth listener for real-time sign in/out
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const adminStatus = checkIsAdmin(currentUser);
      setIsAuthenticatedAdmin(adminStatus);

      if (adminStatus) {
        const storedView = localStorage.getItem("voiceorder_view_mode") as RoleMode | null;
        setViewModeState(storedView === "CUSTOMER" ? "CUSTOMER" : "ADMIN");
      } else {
        setViewModeState("CUSTOMER");
        localStorage.setItem("voiceorder_view_mode", "CUSTOMER");
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setViewMode = (newMode: RoleMode) => {
    if (!isAuthenticatedAdmin && newMode === "ADMIN") {
      // Unauthenticated user cannot switch to ADMIN - open login dialog
      setShowAdminModal(true);
      return;
    }
    setViewModeState(newMode);
    localStorage.setItem("voiceorder_view_mode", newMode);
  };

  const toggleRole = () => {
    if (!isAuthenticatedAdmin) {
      // Must be logged in as Admin to enter Admin mode!
      setShowAdminModal(true);
      return;
    }
    const next = viewMode === "CUSTOMER" ? "ADMIN" : "CUSTOMER";
    setViewMode(next);
  };

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
    setIsAuthenticatedAdmin(false);
    setViewModeState("CUSTOMER");
  };

  // Only true if user is authenticated AND currently in ADMIN view
  const isAdmin = isAuthenticatedAdmin && viewMode === "ADMIN";
  const isCustomer = !isAdmin;

  return (
    <RoleContext.Provider
      value={{
        user,
        role: isAdmin ? "ADMIN" : "CUSTOMER",
        viewMode,
        isAdmin,
        isCustomer,
        isAuthenticatedAdmin,
        showAdminModal,
        setShowAdminModal,
        toggleRole,
        setViewMode,
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
