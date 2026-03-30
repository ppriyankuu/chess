"use client";

import { useEffect } from "react";

type PieceType = "q" | "r" | "b" | "n";

interface PromotionDialogProps {
    color: "w" | "b";
    onSelect: (piece: PieceType) => void;
    onCancel: () => void;
}

// Unicode chess symbols - match the pieces shown on the board
const PIECE_SYMBOLS: Record<"w" | "b", Record<PieceType, string>> = {
    w: {
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
    },
    b: {
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
    },
};

const PIECE_LABELS: Record<PieceType, string> = {
    q: "Queen",
    r: "Rook",
    b: "Bishop",
    n: "Knight",
};

export const PromotionDialog = ({ color, onSelect, onCancel }: PromotionDialogProps) => {
    // Handle ESC key to cancel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    const pieces: PieceType[] = ["q", "r", "b", "n"];

    // Handle click on backdrop to cancel
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-base-200 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4 relative mx-4">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-2 rounded-full hover:bg-base-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Cancel promotion"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                <h3 className="text-xl font-bold mb-2">Choose Promotion</h3>

                <div className="grid grid-cols-4 gap-3">
                    {pieces.map((piece) => (
                        <button
                            key={piece}
                            onClick={() => onSelect(piece)}
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-base-300 hover:bg-primary hover:text-primary-content focus:outline-none focus:ring-2 cursor-pointer focus:ring-primary focus:ring-offset-2"
                            title={PIECE_LABELS[piece]}
                        >
                            <span className="text-4xl mb-1">
                                {PIECE_SYMBOLS[color][piece]}
                            </span>
                            <span className="text-xs font-medium">
                                {PIECE_LABELS[piece]}
                            </span>
                        </button>
                    ))}
                </div>

                <p className="text-xs opacity-60 pt-2">
                    Tap outside or press ESC to cancel
                </p>
            </div>
        </div>
    );
};
