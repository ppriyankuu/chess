"use client";

import { useGame } from "@/context/gameContext";
import { useNotification } from "@/context/notificationContext";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Chess, Square } from "chess.js";
import { PromotionDialog } from "./ui/promotionDialog";

export const ChessBoard = () => {
    const { state, color, send, errorTick } = useGame();
    const { notify } = useNotification();

    const [localFen, setLocalFen] = useState<string | null>(null);
    const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);

    // Sync local fen with server truth
    useEffect(() => {
        if (state?.fen) {
            setLocalFen(state.fen);
            // Clear pending move when server confirms
            setPendingMove(null);
        }
    }, [state?.fen, errorTick]);

    // Calculate last move highlights from server state
    const lastMoveHighlights = useMemo(() => {
        if (!state || !state.fen) return {};

        const highlights: Record<string, React.CSSProperties> = {};

        // Highlight last move squares (from GAME_UPDATE)
        if (state.moves.length > 0) {
            const lastMove = state.moves[state.moves.length - 1];
            if (lastMove) {
                highlights[lastMove.from] = {
                    backgroundColor: "rgba(255, 255, 0, 0.4)",
                };
                highlights[lastMove.to] = {
                    backgroundColor: "rgba(255, 255, 0, 0.4)",
                };
            }
        }

        // Highlight king in check - use server-confirmed state.fen
        if (state.isCheck) {
            const chess = new Chess(state.fen);
            const kingColor = state.turn;
            const board = chess.board();

            // Find king position - board[0] is rank 8, board[7] is rank 1
            for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
                for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
                    const piece = board[rankIdx][fileIdx];
                    if (piece && piece.type === "k" && piece.color === kingColor) {
                        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
                        const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
                        const kingSquare = `${files[fileIdx]}${ranks[rankIdx]}` as Square;
                        highlights[kingSquare] = {
                            backgroundColor: "rgba(255, 0, 0, 0.6)",
                        };
                        return highlights;
                    }
                }
            }
        }

        return highlights;
    }, [state?.moves, state?.isCheck, state?.turn, state?.fen]);

    // Check if a move is a pawn promotion
    const isPromotionMove = useCallback((from: string, to: string, chess: Chess): boolean => {
        const piece = chess.get(from as Square);
        if (!piece || piece.type !== "p") return false;

        // White pawn promoting (reaching rank 8)
        if (piece.color === "w" && to[1] === "8") return true;
        // Black pawn promoting (reaching rank 1)
        if (piece.color === "b" && to[1] === "1") return true;

        return false;
    }, []);

    // Memoize onDrop to prevent recreating on every render
    const onDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
        if (!localFen) return false;

        // Check turn using localFen instead of state to avoid stale closure
        const chess = new Chess(localFen);
        const isMyTurn = chess.turn() === color;

        if (!isMyTurn || !targetSquare) return false;

        if (sourceSquare === targetSquare) {
            return false;
        }

        // Check if this is a promotion move
        if (isPromotionMove(sourceSquare, targetSquare, chess)) {
            // First validate the move is legal (with temporary promotion)
            try {
                chess.move({
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: "q",
                });
                // Move is valid, now show the promotion dialog
                setPendingPromotion({ from: sourceSquare, to: targetSquare });
                return true;
            } catch (err) {
                notify("Invalid move!", "error");
                return false;
            }
        }

        try {
            const move = chess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q",
            });

            setLocalFen(chess.fen());
            setPendingMove({ from: sourceSquare, to: targetSquare });

            send({
                type: "MAKE_MOVE",
                payload: { from: sourceSquare, to: targetSquare, promotion: "q" },
            });

            return true;
        } catch (err) {
            notify("Invalid move!", "error");
            return false;
        }
    }, [localFen, color, send, notify, isPromotionMove]);

    // Handle promotion piece selection
    const handlePromotionSelect = useCallback((piece: "q" | "r" | "b" | "n") => {
        if (!pendingPromotion || !localFen) return;

        const chess = new Chess(localFen);

        try {
            const move = chess.move({
                from: pendingPromotion.from,
                to: pendingPromotion.to,
                promotion: piece,
            });

            setLocalFen(chess.fen());
            setPendingMove({ from: pendingPromotion.from, to: pendingPromotion.to });
            setPendingPromotion(null);

            send({
                type: "MAKE_MOVE",
                payload: {
                    from: pendingPromotion.from,
                    to: pendingPromotion.to,
                    promotion: piece,
                },
            });
        } catch (err) {
            notify("Invalid move!", "error");
            setPendingPromotion(null);
        }
    }, [pendingPromotion, localFen, send, notify]);

    // Handle promotion cancellation (ESC key or clicking outside)
    const handlePromotionCancel = useCallback(() => {
        if (!pendingPromotion || !localFen) return;

        // Reset the board to the server-confirmed state
        setPendingPromotion(null);
        // The board will revert to server state via the useEffect that syncs with state.fen
        notify("Promotion cancelled", "error");
    }, [pendingPromotion, localFen, notify]);

    // #7 - Combine last move highlights with pending move highlights
    const customSquareStyles = useMemo(() => {
        const styles: Record<string, React.CSSProperties> = { ...lastMoveHighlights };

        // Highlight pending move squares
        if (pendingMove) {
            styles[pendingMove.from] = {
                backgroundColor: "rgba(0, 255, 0, 0.5)",
            };
            styles[pendingMove.to] = {
                backgroundColor: "rgba(0, 255, 0, 0.5)",
            };
        }

        return styles;
    }, [lastMoveHighlights, pendingMove]);

    if (!state || !localFen) {
        return (
            <div className="card bg-base-200 p-10 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="card bg-base-200 shadow-xl p-4">
            <Chessboard
                options={{
                    position: localFen,
                    boardOrientation: color === "b" ? "black" : "white",
                    onPieceDrop: onDrop,
                    animationDurationInMs: 120,
                    allowDragging: state.turn === color,
                    squareStyles: customSquareStyles,
                }}
            />
            {pendingPromotion && color && (
                <PromotionDialog
                    color={color}
                    onSelect={handlePromotionSelect}
                    onCancel={handlePromotionCancel}
                />
            )}
        </div>
    );
};
