"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessEngine = void 0;
const chess_js_1 = require("chess.js");
class ChessEngine {
    constructor() {
        this.chess = new chess_js_1.Chess();
    }
    getState() {
        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            isCheck: this.chess.isCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            isStalemate: this.chess.isStalemate(),
            moves: this.chess.history({ verbose: true }),
        };
    }
    makeMove(from, to, promotion) {
        try {
            const move = this.chess.move({ from, to, promotion });
            return move;
        }
        catch (e) {
            return null;
        }
    }
    isGameOver() {
        return this.chess.isGameOver();
    }
    getFen() {
        return this.chess.fen();
    }
}
exports.ChessEngine = ChessEngine;
