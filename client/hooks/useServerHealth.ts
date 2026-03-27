"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
    status: "healthy" | "unhealthy" | "checking";
    lastChecked: Date | null;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8081";

export function useServerHealth() {
    const [health, setHealth] = useState<HealthStatus>({
        status: "checking",
        lastChecked: null,
    });

    const checkHealth = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${SERVER_URL}/health`, {
                method: "GET",
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                setHealth({
                    status: "healthy",
                    lastChecked: new Date(),
                });
            } else {
                setHealth({
                    status: "unhealthy",
                    lastChecked: new Date(),
                });
            }
        } catch (error) {
            setHealth({
                status: "unhealthy",
                lastChecked: new Date(),
            });
        }
    };

    useEffect(() => {
        // Check only once on page load
        checkHealth();
    }, []);

    return health;
}
