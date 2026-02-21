"use client";

import { useState } from "react";
import { useGame } from "@/context/gameContext";
import { useRouter } from "next/navigation";
import { OpponentJoinNotifier } from "../OpponentJoinNotifier";
import { MoveList } from "./movesList";

export const GameStatus = () => {
    const { state, color, gameId, playerId, leaveGame } = useGame();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    if (!state) {
        return (
            <div className="card bg-base-200 shadow-md p-6">
                <div className="flex items-center gap-3">
                    <span className="loading loading-spinner"></span>
                    <span>Waiting for game state...</span>
                </div>
            </div>
        );
    }

    const opponentColor = color === "w" ? "b" : "w";
    const opponent =
        color === "w" ? state.players.black : state.players.white;

    const isMyTurn = state.turn === color;

    const handleCopy = async () => {
        if (!gameId) return;
        await navigator.clipboard.writeText(gameId);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleLeave = () => {
        leaveGame();
        router.push('/');
    };

    return (
        <>
            <OpponentJoinNotifier opponentPlayerId={opponent?.playerId} />

            <div className="card bg-base-200 shadow-xl p-6 flex flex-col h-[80vh] lg:h-[90vh]">

                {/* Header */}
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">Game Room</h2>

                    <div className="flex items-center gap-2">
                        <span className="text-sm opacity-60">Game ID:</span>

                        <div className="flex items-center gap-2 bg-base-300 px-3 py-1 rounded-lg">
                            <span className="text-sm font-mono break-all">
                                {gameId}
                            </span>

                            <button
                                onClick={handleCopy}
                                className="btn btn-xs btn-ghost"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Turn Status */}
                <div className="flex items-center justify-between">
                    <span className="font-medium">Current Turn</span>
                    <span
                        className={`badge ${state.turn === "w"
                            ? "badge-neutral"
                            : "badge-primary"
                            }`}
                    >
                        {state.turn === "w" ? "White" : "Black"}
                    </span>
                </div>

                {/* You */}
                <div className="divider">You</div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Color</span>
                        <span className="badge badge-outline">
                            {color === "w" ? "White" : "Black"}
                        </span>
                    </div>

                    <div className="opacity-60 break-all">
                        Player ID: {playerId}
                    </div>
                </div>

                {/* Opponent */}
                <div className="divider">Opponent</div>

                {opponent.playerId ? (
                    <div className="bg-base-300 p-3 rounded-lg text-sm space-y-1">
                        <div className="break-all">
                            Player ID: {opponent.playerId}
                        </div>
                        <div className="opacity-60">
                            Color: {opponentColor === "w" ? "White" : "Black"}
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-info">
                        Waiting for opponent to join...
                    </div>
                )}

                {/* Game Alert */}
                {state.isCheck && (
                    <div className="alert alert-warning">Check!</div>
                )}

                {/* Turn Indicator */}
                <div className="divider"></div>

                <div
                    className={`text-center font-semibold text-lg transition-colors ${isMyTurn ? "text-success" : "opacity-60"
                        }`}
                >
                    {isMyTurn ? "Your move" : "Opponent's move"}
                </div>

                <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin scrollbar-thumb-base-300">
                    <MoveList />
                </div>

                {/* Leave Button */}
                <div className="pt-4">
                    <button
                        onClick={handleLeave}
                        className="btn btn-error btn-outline w-full"
                    >
                        Leave Game
                    </button>
                </div>
            </div>
        </>
    );
};