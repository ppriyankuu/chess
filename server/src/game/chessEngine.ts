import { Chess, Move } from "chess.js";
import { GameState, PlayerColor } from "../types";

export class ChessEngine {
    private chess: Chess;

    constructor() {
        this.chess = new Chess();
    }

    public getState(): Omit<GameState, "players"> {
        return {
            fen: this.chess.fen(),
            turn: this.chess.turn() as PlayerColor,
            isCheck: this.chess.isCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            isStalemate: this.chess.isStalemate(),
            moves: this.chess.history({ verbose: true }),
        };
    }

    public makeMove(from: string, to: string, promotion?: string): Move | null {
        try {
            const move = this.chess.move({ from, to, promotion });
            return move;
        } catch (e) {
            return null;
        }
    }

    public isGameOver(): boolean {
        return this.chess.isGameOver();
    }

    public getFen(): string {
        return this.chess.fen();
    }
}