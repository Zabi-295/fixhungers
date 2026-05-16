import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import apiFetch from "@/lib/api";
import { toIsoDateString } from "@/lib/donation-utils";

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: "Provider" | "NGO" | "Admin";
  status: boolean;
  registeredAt: string;
  avatar?: string;
   emailVerified?: boolean;
   lat?: number;
   lng?: number;
   location?: string;
}

interface AdminContextType {
  users: RegisteredUser[];
  addUser: (user: Omit<RegisteredUser, "id" | "registeredAt" | "status">) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  editUser: (id: string, updates: Partial<RegisteredUser>) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<RegisteredUser[]>([]);

  const fetchUsers = async () => {
    try {
      const items = await apiFetch('/users');
      const normalizedUsers = items
        .map((user: any) => ({
          id: user._id || user.id,
          name: user.name || user.email?.split("@")[0] || "Unknown User",
          email: user.email || "",
          role: user.role,
          status: user.status !== false,
          registeredAt: toIsoDateString(user.createdAt || new Date().toISOString()),
          avatar: user.avatar,
          emailVerified: Boolean(user.emailVerified),
          lat: typeof user.lat === "number" ? user.lat : undefined,
          lng: typeof user.lng === "number" ? user.lng : undefined,
          location: user.location || user.profile?.address || user.profile?.location || "",
        }))
        .sort((a: any, b: any) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

      setUsers(normalizedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUsers();
      const interval = setInterval(fetchUsers, 10000); // 10s polling
      return () => clearInterval(interval);
    }
  }, []);

  const addUser = async (user: Omit<RegisteredUser, "id" | "registeredAt" | "status">) => {
    await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ ...user, password: 'Password123!' }), // Admin created users get a default password
    });
    fetchUsers();
  };

  const toggleUserStatus = async (id: string) => {
    const targetUser = users.find((user) => user.id === id);
    if (!targetUser) return;

    await apiFetch(`/users/${id}/status`, { 
      method: 'PUT',
      body: JSON.stringify({ status: !targetUser.status }) 
    });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const editUser = async (id: string, updates: Partial<RegisteredUser>) => {
    await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    fetchUsers();
  };

  return (
    <AdminContext.Provider value={{ users, addUser, toggleUserStatus, deleteUser, editUser }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};

