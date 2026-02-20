"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameManager = void 0;
const idGenerator_1 = require("../utils/idGenerator");
const chessEngine_1 = require("./chessEngine");
const ws_1 = require("ws");
class GameManager {
    constructor() {
        this.games = new Map();
    }
    createGame(ws, playerId) {
        const gameId = (0, idGenerator_1.generateGameId)();
        const room = {
            id: gameId,
            engine: new chessEngine_1.ChessEngine(),
            players: { white: null, black: null },
            createdAt: Date.now(),
        };
        room.players.white = {
            playerId,
            ws,
            color: 'w'
        };
        this.games.set(gameId, room);
        return {
            gameId,
            state: this.getGameState(gameId)
        };
    }
    joinGame(playerId, gameId, ws) {
        var _a, _b;
        const room = this.games.get(gameId);
        if (!room)
            return { success: false, error: 'Game not found' };
        if (((_a = room.players.white) === null || _a === void 0 ? void 0 : _a.playerId) === playerId) {
            room.players.white.ws = ws;
            return {
                success: true,
                color: 'w',
                state: this.getGameState(gameId),
            };
        }
        if (((_b = room.players.black) === null || _b === void 0 ? void 0 : _b.playerId) === playerId) {
            room.players.black.ws = ws;
            return {
                success: true,
                color: 'b',
                state: this.getGameState(gameId)
            };
        }
        if (room.players.black !== null)
            return { success: false, error: 'Game is full' };
        room.players.black = {
            playerId,
            ws,
            color: 'b',
        };
        return {
            success: true,
            color: 'b',
            state: this.getGameState(gameId)
        };
    }
    getGameState(gameId) {
        var _a, _b, _c, _d, _e, _f;
        const room = this.games.get(gameId);
        if (!room)
            throw new Error('Game not found');
        const chessState = room.engine.getState();
        return Object.assign(Object.assign({}, chessState), { players: {
                white: {
                    playerId: (_b = (_a = room.players.white) === null || _a === void 0 ? void 0 : _a.playerId) !== null && _b !== void 0 ? _b : null,
                    connected: !!((_c = room.players.white) === null || _c === void 0 ? void 0 : _c.ws),
                },
                black: {
                    playerId: (_e = (_d = room.players.black) === null || _d === void 0 ? void 0 : _d.playerId) !== null && _e !== void 0 ? _e : null,
                    connected: !!((_f = room.players.black) === null || _f === void 0 ? void 0 : _f.ws),
                },
            } });
    }
    processMove(gameId, ws, from, to, promotion) {
        const room = this.games.get(gameId);
        if (!room)
            return { success: false, error: 'Game not found' };
        const turn = room.engine.getState().turn;
        const currentPlayer = turn === 'w' ? room.players.white : room.players.black;
        if (!currentPlayer || currentPlayer.ws !== ws)
            return { success: false, error: 'Not your turn' };
        const move = room.engine.makeMove(from, to, promotion);
        if (!move)
            return { success: false, error: 'Invalid move' };
        return {
            success: true,
            state: this.getGameState(gameId),
            move
        };
    }
    removePlayer(ws) {
        var _a, _b, _c, _d, _e, _f;
        let foundGameId;
        let remainingPlayers = 0;
        for (const [id, room] of this.games.entries()) {
            if (((_a = room.players.white) === null || _a === void 0 ? void 0 : _a.ws) === ws) {
                room.players.white.ws = null;
                foundGameId = id;
            }
            if (((_b = room.players.black) === null || _b === void 0 ? void 0 : _b.ws) === ws) {
                room.players.black.ws = null;
                foundGameId = id;
            }
            if (foundGameId) {
                remainingPlayers =
                    (((_c = room.players.white) === null || _c === void 0 ? void 0 : _c.ws) ? 1 : 0) +
                        (((_d = room.players.black) === null || _d === void 0 ? void 0 : _d.ws) ? 1 : 0);
                // delete room if no one's present
                if (!((_e = room.players.white) === null || _e === void 0 ? void 0 : _e.ws) && !((_f = room.players.black) === null || _f === void 0 ? void 0 : _f.ws)) {
                    this.games.delete(id);
                }
                break;
            }
        }
        return { gameId: foundGameId, remainingPlayers };
    }
    getOpponentWs(gameId, currentWs) {
        var _a, _b, _c, _d, _e, _f;
        const room = this.games.get(gameId);
        if (!room)
            return null;
        if (((_a = room.players.white) === null || _a === void 0 ? void 0 : _a.ws) === currentWs)
            return (_c = (_b = room.players.black) === null || _b === void 0 ? void 0 : _b.ws) !== null && _c !== void 0 ? _c : null;
        if (((_d = room.players.black) === null || _d === void 0 ? void 0 : _d.ws) === currentWs)
            return (_f = (_e = room.players.white) === null || _e === void 0 ? void 0 : _e.ws) !== null && _f !== void 0 ? _f : null;
        return null;
    }
    getRoom(gameId) {
        return this.games.get(gameId);
    }
    broadcastToGame(gameId, event) {
        var _a, _b, _c, _d;
        const room = this.games.get(gameId);
        if (!room)
            return;
        const message = JSON.stringify(event);
        if (((_b = (_a = room.players.white) === null || _a === void 0 ? void 0 : _a.ws) === null || _b === void 0 ? void 0 : _b.readyState) === ws_1.WebSocket.OPEN)
            room.players.white.ws.send(message);
        if (((_d = (_c = room.players.black) === null || _c === void 0 ? void 0 : _c.ws) === null || _d === void 0 ? void 0 : _d.readyState) === ws_1.WebSocket.OPEN)
            room.players.black.ws.send(message);
    }
}
exports.gameManager = new GameManager();
