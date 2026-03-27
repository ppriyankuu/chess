import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ClientEvent, PlayerColor, ServerEvent } from './types';
import { gameManager } from './game/gameManager';
import { generatePlayerId } from './utils/idGenerator';

interface AuthedWebSocket extends WebSocket {
    gameId?: string;
    playerId?: string;
}

export const initServer = (port: number) => {
    // Health check HTTP server
    const healthServer = http.createServer((req, res) => {
        // Allow all origins (CORS)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.url === '/health' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });

    // WebSocket server on the same HTTP server
    const wss = new WebSocketServer({ server: healthServer });

    console.log(`Server running on http://localhost:${port}`);
    console.log(`Health check endpoint: http://localhost:${port}/health`);

    wss.on('connection', (ws: AuthedWebSocket) => {
        console.log('New connection established.');

        ws.gameId = undefined;
        ws.playerId = generatePlayerId();

        ws.on('message', (data) => {
            try {
                const message: ClientEvent = JSON.parse(data.toString());
                handleMessage(ws, message);
            } catch (error) {
                sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            console.log('Connection closed');
            handleDisconnect(ws);
        });
    });

    healthServer.listen(port);
};

const sendMessage = (ws: WebSocket, event: ServerEvent) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
    }
};

const sendError = (ws: WebSocket, message: string) => {
    sendMessage(ws, { type: 'ERROR', payload: { message } });
};

const handleMessage = (ws: AuthedWebSocket, message: ClientEvent) => {
    switch (message.type) {
        case 'CREATE_GAME': {
            const result = gameManager.createGame(ws, ws.playerId!);
            ws.gameId = result.gameId;

            sendMessage(ws, {
                type: 'GAME_CREATED',
                payload: {
                    gameId: result.gameId,
                    color: 'w',
                    playerId: ws.playerId!,
                    state: result.state
                }
            });

            break;
        }

        case 'JOIN_GAME': {
            const { gameId } = message.payload;

            const result = gameManager.joinGame(ws.playerId!, gameId, ws);

            if (result.success && result.state) {
                ws.gameId = gameId; // Track game on socket

                sendMessage(ws, {
                    type: 'GAME_JOINED',
                    payload: { gameId, color: result.color!, state: result.state, playerId: ws.playerId! }
                });

                gameManager.broadcastToGame(gameId, {
                    type: 'GAME_UPDATE',
                    payload: { state: result.state },
                });
            } else {
                sendError(ws, result.error ?? 'Failed to join');
            }

            break;
        }

        case 'MAKE_MOVE': {
            const gameId = ws.gameId;
            if (!gameId) {
                sendError(ws, 'Not in a game');
                return;
            }

            const { from, to, promotion } = message.payload;

            const result = gameManager.processMove(gameId, ws, from, to, promotion);

            if (result.success && result.state) {
                // Broadcast to both players using Manager
                gameManager.broadcastToGame(gameId, {
                    type: 'GAME_UPDATE',
                    payload: {
                        state: result.state,
                        lastMove: { from, to }
                    }
                });

                if (result.state.isCheckmate || result.state.isDraw || result.state.isStalemate) {
                    let winner: PlayerColor | 'draw' | 'stalemate' = 'draw';
                    let reason = 'Draw';

                    if (result.state.isCheckmate) {
                        winner = result.state.turn === 'w' ? 'b' : 'w';
                        reason = 'Checkmate';
                    } else if (result.state.isStalemate) {
                        winner = 'stalemate';
                        reason = 'Stalemate';
                    } else if (result.state.isDraw) {
                        winner = 'draw';
                        reason = 'Draw by rules';
                    }

                    gameManager.broadcastToGame(gameId, {
                        type: 'GAME_OVER',
                        payload: { winner, reason }
                    });
                }
            } else {
                sendError(ws, result.error || 'Invalid move');
            }
            break;
        }

        case 'LEAVE_GAME': {
            const gameId = ws.gameId;

            if (gameId) {
                gameManager.removePlayer(ws);

                gameManager.broadcastToGame(gameId, {
                    type: 'OPPONENT_LEFT',
                    payload: { message: 'Opponent left the game' }
                });

                ws.gameId = undefined;
            }

            ws.close();
            break;
        }

        default:
            sendError(ws, 'Unknown event type');
    }
};

const handleDisconnect = (ws: AuthedWebSocket) => {
    const gameId = ws.gameId;

    if (gameId) {
        gameManager.removePlayer(ws);

        gameManager.broadcastToGame(gameId, {
            type: 'OPPONENT_LEFT',
            payload: { message: 'Opponent disconnected' }
        });
    }
};