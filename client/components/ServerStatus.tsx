"use client";

import { useServerHealth } from "@/hooks/useServerHealth";

export const ServerStatus = () => {
    const { status } = useServerHealth();

    const getStatusColor = () => {
        switch (status) {
            case "healthy":
                return "bg-green-500";
            case "unhealthy":
                return "bg-red-500";
            case "checking":
                return "bg-yellow-500 animate-pulse";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusText = () => {
        switch (status) {
            case "healthy":
                return "Online";
            case "unhealthy":
                return "Offline";
            case "checking":
                return "Checking...";
        }
    };

    return (
        <div className="flex items-center gap-2 text-xs text-base-content/60">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
            <span>{getStatusText()}</span>
            <span className="text-xs text-base-content/40">
                (server)
            </span>
        </div>
    );
};
