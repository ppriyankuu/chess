"use client";

import { useGame } from "@/context/gameContext";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";

export const ChessBoard = () => {
    const { state, color, send } = useGame();

    if (!state) {
        return (
            <div className="card bg-base-200 p-10 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    const isMyTurn = state.turn === color;

    const onDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
        if (!isMyTurn || !targetSquare) return false;

        send({
            type: "MAKE_MOVE",
            payload: { from: sourceSquare, to: targetSquare },
        });

        return true;
    };

    return (
        <div className="card bg-base-200 shadow-xl p-4">
            <Chessboard
                options={{
                    position: state.fen,
                    boardOrientation: color === "b" ? "black" : "white",
                    onPieceDrop: onDrop,
                    animationDurationInMs: 200,
                    allowDragging: isMyTurn,
                }}
            />
        </div>
    );
};