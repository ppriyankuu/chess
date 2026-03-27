"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = void 0;
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const gameManager_1 = require("./game/gameManager");
const idGenerator_1 = require("./utils/idGenerator");
const initServer = (port) => {
    const wss = new ws_1.WebSocketServer({ port });
    console.log(`WebSocket server running on ws://localhost:${port}`);
    // Health check HTTP server
    const healthServer = http_1.default.createServer((req, res) => {
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
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });
    // Use a different port for health check (main port + 1)
    const healthPort = port + 1;
    healthServer.listen(healthPort, () => {
        console.log(`Health check endpoint running on http://localhost:${healthPort}/health`);
    });
    wss.on('connection', (ws) => {
        console.log('New connection established.');
        ws.gameId = undefined;
        ws.playerId = (0, idGenerator_1.generatePlayerId)();
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleMessage(ws, message);
            }
            catch (error) {
                sendError(ws, 'Invalid message format');
            }
        });
        ws.on('close', () => {
            console.log('Connection closed');
            handleDisconnect(ws);
        });
    });
};
exports.initServer = initServer;
const sendMessage = (ws, event) => {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
    }
};
const sendError = (ws, message) => {
    sendMessage(ws, { type: 'ERROR', payload: { message } });
};
const handleMessage = (ws, message) => {
    var _a;
    switch (message.type) {
        case 'CREATE_GAME': {
            const result = gameManager_1.gameManager.createGame(ws, ws.playerId);
            ws.gameId = result.gameId;
            sendMessage(ws, {
                type: 'GAME_CREATED',
                payload: {
                    gameId: result.gameId,
                    color: 'w',
                    playerId: ws.playerId,
                    state: result.state
                }
            });
            break;
        }
        case 'JOIN_GAME': {
            const { gameId } = message.payload;
            const result = gameManager_1.gameManager.joinGame(ws.playerId, gameId, ws);
            if (result.success && result.state) {
                ws.gameId = gameId; // Track game on socket
                sendMessage(ws, {
                    type: 'GAME_JOINED',
                    payload: { gameId, color: result.color, state: result.state, playerId: ws.playerId }
                });
                gameManager_1.gameManager.broadcastToGame(gameId, {
                    type: 'GAME_UPDATE',
                    payload: { state: result.state },
                });
            }
            else {
                sendError(ws, (_a = result.error) !== null && _a !== void 0 ? _a : 'Failed to join');
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
            const result = gameManager_1.gameManager.processMove(gameId, ws, from, to, promotion);
            if (result.success && result.state) {
                // Broadcast to both players using Manager
                gameManager_1.gameManager.broadcastToGame(gameId, {
                    type: 'GAME_UPDATE',
                    payload: {
                        state: result.state,
                        lastMove: { from, to }
                    }
                });
                if (result.state.isCheckmate || result.state.isDraw || result.state.isStalemate) {
                    let winner = 'draw';
                    let reason = 'Draw';
                    if (result.state.isCheckmate) {
                        winner = result.state.turn === 'w' ? 'b' : 'w';
                        reason = 'Checkmate';
                    }
                    else if (result.state.isStalemate) {
                        winner = 'stalemate';
                        reason = 'Stalemate';
                    }
                    else if (result.state.isDraw) {
                        winner = 'draw';
                        reason = 'Draw by rules';
                    }
                    gameManager_1.gameManager.broadcastToGame(gameId, {
                        type: 'GAME_OVER',
                        payload: { winner, reason }
                    });
                }
            }
            else {
                sendError(ws, result.error || 'Invalid move');
            }
            break;
        }
        case 'LEAVE_GAME': {
            const gameId = ws.gameId;
            if (gameId) {
                gameManager_1.gameManager.removePlayer(ws);
                gameManager_1.gameManager.broadcastToGame(gameId, {
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
const handleDisconnect = (ws) => {
    const gameId = ws.gameId;
    if (gameId) {
        gameManager_1.gameManager.removePlayer(ws);
        gameManager_1.gameManager.broadcastToGame(gameId, {
            type: 'OPPONENT_LEFT',
            payload: { message: 'Opponent disconnected' }
        });
    }
};
