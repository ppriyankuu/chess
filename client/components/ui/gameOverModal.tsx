"use client";

import { useGame } from "@/context/gameContext";
import { useRouter } from "next/navigation";

export const GameOverModal = () => {
    const { state, color, isGameOver, leaveGame } = useGame();
    const router = useRouter();

    if (!isGameOver || !state) return null;

    let title = "";
    let subtitle = "";

    title = "Opponent Left";
    subtitle = "You win!";

    if (state.isCheckmate) {
        const winner = state.turn === "w" ? "Black" : "White";
        const didIWin =
            (color === "w" && winner === "White") ||
            (color === "b" && winner === "Black");

        title = "Checkmate!";
        subtitle = didIWin ? "You won! 🎉" : "You lost.";
    }
    else if (state.isDraw || state.isStalemate) {
        title = "Draw";
        subtitle = "Nobody wins this time.";
    }

    const handleClose = () => {
        leaveGame();
        router.push("/");
    };

    return (
        <div className="fixed inset-0 px-2 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-base-200 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-lg opacity-80">{subtitle}</p>

                <button
                    onClick={handleClose}
                    className="btn btn-primary w-full"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};