"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type NotificationType = "success" | "error" | "info";

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = (message: string, type: NotificationType = "info") => {
        const id = crypto.randomUUID();

        setNotifications((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4000);
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            {/* Toast Container */}
            <div className="toast toast-top toast-end z-50">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`alert ${n.type === "error"
                                ? "alert-error"
                                : n.type === "success"
                                    ? "alert-success"
                                    : "alert-info"
                            } shadow-lg`}
                    >
                        <span>{n.message}</span>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotification must be used inside provider");
    return ctx;
};