import { Move } from "chess.js";
import { ClientEvent, GameState, PlayerColor, ServerEvent } from "../types";
import { generateGameId } from "../utils/idGenerator";
import { ChessEngine } from "./chessEngine";
import { WebSocket } from 'ws';

interface Player {
    ws: WebSocket | null;
    playerId: string;
    color: PlayerColor;
}

interface GameRoom {
    id: string;
    engine: ChessEngine;
    players: {
        white: Player | null;
        black: Player | null;
    };
    createdAt: number;
}

class GameManager {
    private games: Map<string, GameRoom> = new Map();

    public createGame(
        ws: WebSocket,
        playerId: string
    ): {
        gameId: string;
        state: GameState;
    } {
        const gameId = generateGameId();

        const room: GameRoom = {
            id: gameId,
            engine: new ChessEngine(),
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

    public joinGame(
        playerId: string,
        gameId: string,
        ws: WebSocket
    ): {
        success: boolean;
        color?: PlayerColor;
        state?: GameState;
        error?: string
    } {
        const room = this.games.get(gameId);

        if (!room)
            return { success: false, error: 'Game not found' };

        if (room.players.white?.playerId === playerId) {
            room.players.white.ws = ws;
            return {
                success: true,
                color: 'w',
                state: this.getGameState(gameId),
            }
        }

        if (room.players.black?.playerId === playerId) {
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

    public getGameState(gameId: string): GameState {
        const room = this.games.get(gameId);
        if (!room) throw new Error('Game not found');

        const chessState = room.engine.getState();

        return {
            ...chessState,
            players: {
                white: {
                    playerId: room.players.white?.playerId ?? null,
                    connected: !!room.players.white?.ws,
                },
                black: {
                    playerId: room.players.black?.playerId ?? null,
                    connected: !!room.players.black?.ws,
                },
            },
        };
    }

    public processMove(gameId: string, ws: WebSocket, from: string, to: string, promotion?: string): {
        success: boolean;
        state?: GameState;
        move?: Move;
        error?: string;
    } {
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
        }
    }

    public removePlayer(ws: WebSocket): {
        gameId?: string;
        remainingPlayers: number;
    } {
        let foundGameId: string | undefined;
        let remainingPlayers = 0;

        for (const [id, room] of this.games.entries()) {

            if (room.players.white?.ws === ws) {
                room.players.white.ws = null;
                foundGameId = id;
            }

            if (room.players.black?.ws === ws) {
                room.players.black.ws = null;
                foundGameId = id;
            }

            if (foundGameId) {
                remainingPlayers =
                    (room.players.white?.ws ? 1 : 0) +
                    (room.players.black?.ws ? 1 : 0);

                // delete room if no one's present
                if (!room.players.white?.ws && !room.players.black?.ws) {
                    this.games.delete(id);
                }

                break;
            }
        }

        return { gameId: foundGameId, remainingPlayers };
    }

    public getOpponentWs(gameId: string, currentWs: WebSocket): WebSocket | null {
        const room = this.games.get(gameId);
        if (!room) return null;

        if (room.players.white?.ws === currentWs) return room.players.black?.ws ?? null;
        if (room.players.black?.ws === currentWs) return room.players.white?.ws ?? null;

        return null;
    }

    public getRoom(gameId: string): GameRoom | undefined {
        return this.games.get(gameId);
    }

    public broadcastToGame(gameId: string, event: ClientEvent | ServerEvent) {
        const room = this.games.get(gameId);
        if (!room) return;

        const message = JSON.stringify(event);
        if (room.players.white?.ws?.readyState === WebSocket.OPEN)
            room.players.white.ws.send(message);

        if (room.players.black?.ws?.readyState === WebSocket.OPEN)
            room.players.black.ws.send(message);
    }
}

export const gameManager = new GameManager();