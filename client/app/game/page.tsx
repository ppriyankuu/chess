"use client";

import { ChessBoard } from "@/components/chessBoard";
import { GameStatus } from "@/components/ui/gameStatus";
import { useGame } from "@/context/gameContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GamePage() {
    const { state, gameId, status, leaveGame } = useGame();
    const router = useRouter();

    // If no game exists, redirect safely
    useEffect(() => {
        if (!gameId && status !== "waiting" && status !== "playing") {
            router.replace("/");
        }
    }, [gameId, status, router]);

    // Fallback UI when context/state is missing
    if (!state || !gameId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100">
                <div className="card bg-base-200 shadow-xl p-8 space-y-6 w-full max-w-md text-center">
                    <div className="space-y-2">
                        <span className="loading loading-spinner loading-lg"></span>
                        <p className="opacity-70">
                            Game session not found or still loading...
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            leaveGame();
                            router.replace("/");
                        }}
                        className="btn btn-error btn-outline w-full"
                    >
                        Leave Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Board Section */}
                <div className="lg:col-span-2 flex justify-center">
                    <ChessBoard />
                </div>

                {/* Info Panel */}
                <div className="flex flex-col gap-4">
                    <GameStatus />
                </div>

            </div>
        </div>
    );
}