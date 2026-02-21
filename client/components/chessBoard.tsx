"use client";

import { useGame } from "@/context/gameContext";
import { useNotification } from "@/context/notificationContext";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";

export const ChessBoard = () => {
    const { state, color, send, errorTick } = useGame();
    const { notify } = useNotification();

    const [localFen, setLocalFen] = useState<string | null>(null);

    // Sync local fen with server truth
    useEffect(() => {
        if (state?.fen) {
            setLocalFen(state.fen);
        }
    }, [state?.fen, errorTick]);

    if (!state || !localFen) {
        return (
            <div className="card bg-base-200 p-10 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    const isMyTurn = state.turn === color;

    const onDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
        if (!isMyTurn || !targetSquare) return false;

        const chess = new Chess(localFen);

        try {
            const move = chess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q",
            });

            // ✅ Optimistic update
            setLocalFen(chess.fen());

            send({
                type: "MAKE_MOVE",
                payload: { from: sourceSquare, to: targetSquare },
            });

            return true;
        } catch (err) {
            // ❌ Invalid move (chess.js throws now)
            notify("Invalid move!", "error");
            return false;
        }
    };

    return (
        <div className="card bg-base-200 shadow-xl p-4">
            <Chessboard
                options={{
                    position: localFen,
                    boardOrientation: color === "b" ? "black" : "white",
                    onPieceDrop: onDrop,
                    animationDurationInMs: 120,
                    allowDragging: isMyTurn,
                }}
            />
        </div>
    );
};