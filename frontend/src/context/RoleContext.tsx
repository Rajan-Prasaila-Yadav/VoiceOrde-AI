"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type RoleMode = "CUSTOMER" | "ADMIN";

interface RoleContextType {
  role: RoleMode;
  setRole: (role: RoleMode) => void;
  toggleRole: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: "CUSTOMER",
  setRole: () => {},
  toggleRole: () => {},
  isAdmin: false,
  isCustomer: true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RoleMode>("CUSTOMER");

  useEffect(() => {
    // Check stored role or default to CUSTOMER
    const stored = localStorage.getItem("voiceorder_view_mode") as RoleMode | null;
    if (stored === "ADMIN" || stored === "CUSTOMER") {
      setRoleState(stored);
    } else {
      // Default view is always customer
      setRoleState("CUSTOMER");
    }
  }, []);

  const setRole = (newRole: RoleMode) => {
    setRoleState(newRole);
    localStorage.setItem("voiceorder_view_mode", newRole);
  };

  const toggleRole = () => {
    const next = role === "CUSTOMER" ? "ADMIN" : "CUSTOMER";
    setRole(next);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        isAdmin: role === "ADMIN",
        isCustomer: role === "CUSTOMER",
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
