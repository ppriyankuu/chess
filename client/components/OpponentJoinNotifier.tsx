"use client";

import { useEffect, useRef } from "react";
import { useNotification } from "@/context/notificationContext";

interface Props {
    opponentPlayerId: string | null | undefined;
}

export const OpponentJoinNotifier = ({ opponentPlayerId }: Props) => {
    const { notify } = useNotification();
    const prevOpponentRef = useRef<string | null | undefined>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip first render (so it doesn't fire if opponent already exists)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevOpponentRef.current = opponentPlayerId;
            return;
        }

        // If previously no opponent and now there is one → notify
        if (!prevOpponentRef.current && opponentPlayerId) {
            notify("Opponent joined the game!", "success");
        }

        prevOpponentRef.current = opponentPlayerId;
    }, [opponentPlayerId, notify]);

    return null; // purely side-effect component
};