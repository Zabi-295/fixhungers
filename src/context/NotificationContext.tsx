import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextType {
  requestPermission: () => Promise<void>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  permission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return;
    }

    const res = await Notification.requestPermission();
    setPermission(res);
    
    if (res === "granted") {
      toast({
        title: "Notifications Enabled!",
        description: "You will now receive real-time updates.",
      });
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    // 1. Play Sound
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(e => console.log("Sound play failed (interaction required):", e));
    } catch (e) {
      console.error("Audio error:", e);
    }

    // 2. Show Browser Notification (if permission granted)
    if (permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        ...options,
      });
    }

    // 3. Also show in-app Toast
    toast({
      title: title,
      description: options?.body || "New update available",
    });
  };


  return (
    <NotificationContext.Provider value={{ requestPermission, sendNotification, permission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
};
