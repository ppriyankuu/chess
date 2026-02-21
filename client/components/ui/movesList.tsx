import { useGame } from "@/context/gameContext";

const pieceNames: Record<string, string> = {
    p: "Pawn",
    r: "Rook",
    n: "Knight",
    b: "Bishop",
    q: "Queen",
    k: "King",
};

export const MoveList = () => {
    const { state } = useGame();

    if (!state?.moves?.length) {
        return <div className="text-sm opacity-50">No moves yet</div>;
    }

    const moves = state.moves;

    const rows = [];

    for (let i = 0; i < moves.length; i += 2) {
        rows.push({
            moveNumber: i / 2 + 1,
            white: moves[i],
            black: moves[i + 1] || null,
        });
    }

    return (
        <div className="text-xs text-base-content/70 space-y-1">
            {rows.map((row) => (
                <div
                    key={row.moveNumber}
                    className="grid grid-cols-[32px_1fr_1fr] items-center gap-2 py-1 px-2 rounded hover:bg-base-300/40 transition-colors"
                >
                    {/* Move number */}
                    <span className="font-medium text-base-content/50">
                        {row.moveNumber}.
                    </span>

                    {/* White move */}
                    <span className="truncate">
                        {row.white
                            ? `${pieceNames[row.white.piece]} ${row.white.from} → ${row.white.to}`
                            : ""}
                    </span>

                    {/* Black move */}
                    <span className="truncate">
                        {row.black
                            ? `${pieceNames[row.black.piece]} ${row.black.from} → ${row.black.to}`
                            : ""}
                    </span>
                </div>
            ))}
        </div>
    );
};