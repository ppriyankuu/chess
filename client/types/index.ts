export type PlayerColor = 'w' | 'b';

export interface GameState {
    fen: string; // chessboard representation
    turn: PlayerColor;
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    isStalemate: boolean;
    players: {
        white: {
            playerId: string | null;
            connected: boolean;
        };
        black: {
            playerId: string | null;
            connected: boolean;
        };
    };
}

export type ClientEvent =
    | { type: 'CREATE_GAME'; payload: {} }
    | { type: 'JOIN_GAME'; payload: { gameId: string } }
    | { type: 'MAKE_MOVE'; payload: { from: string; to: string; promotion?: string } }
    | { type: 'LEAVE_GAME'; payload: {} };

export type ServerEvent =
    | { type: 'GAME_CREATED'; payload: { gameId: string; color: PlayerColor; playerId: string; state: GameState } }
    | { type: 'GAME_JOINED'; payload: { gameId: string; color: PlayerColor; state: GameState, playerId: string } }
    | { type: 'GAME_UPDATE'; payload: { state: GameState; lastMove?: { from: string; to: string } } }
    | { type: 'GAME_OVER'; payload: { winner: PlayerColor | 'draw' | 'stalemate'; reason: string } }
    | { type: 'ERROR'; payload: { message: string } }
    | { type: 'OPPONENT_LEFT'; payload: { message: string } };