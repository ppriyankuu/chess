"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { ClientEvent, GameState, ServerEvent } from "@/types";
import { connectSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useNotification } from "./notificationContext";

interface GameContextType {
  state: GameState | null;
  gameId: string | null;
  playerId: string | null;
  color: "w" | "b" | null;
  isGameOver: boolean;
  send: (event: ClientEvent) => void;
  leaveGame: () => void;
  errorTick: number;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {

  const router = useRouter();

  const { notify } = useNotification();

  const [state, setState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [color, setColor] = useState<"w" | "b" | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);


  const [errorTick, setErrorTick] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const isLeavingRef = useRef(false);
  const intentionalCloseRef = useRef(false);

  const resetGameState = () => {
    setState(null);
    setGameId(null);
    setPlayerId(null);
    setColor(null);
    setIsGameOver(false);
  };

  const leaveGame = () => {
    intentionalCloseRef.current = true;

    send({ type: "LEAVE_GAME", payload: {} });

    socketRef.current?.close();

    resetGameState();
  };

  const connect = () => {
    const socket = connectSocket((data: ServerEvent) => {
      handleServerEvent(data);
    });

    socketRef.current = socket;

    socket.onclose = () => {
      console.log("🔌 Socket closed");

      socketRef.current = null;

      if (intentionalCloseRef.current) {
        intentionalCloseRef.current = false;
        return;
      }

      console.log("Reconnecting...");
      setTimeout(connect, 1000);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const send = (event: ClientEvent) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.log("Socket not ready. Reconnecting...");
      connect();
    }

    setTimeout(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(event));
      } else {
        console.warn("⚠️ Socket still not ready");
      }
    }, 200); // small delay to allow connection to open
  };

  const handleServerEvent = (event: ServerEvent) => {
    switch (event.type) {
      case "GAME_CREATED":
        setGameId(event.payload.gameId);
        setPlayerId(event.payload.playerId);
        setColor(event.payload.color);
        setState(event.payload.state);
        router.push('/game');
        break;

      case "GAME_JOINED":
        setGameId(event.payload.gameId);
        setPlayerId(event.payload.playerId);
        setColor(event.payload.color);
        setState(event.payload.state);

        notify("Game started!", "success");
        router.push('/game');
        break;

      case "OPPONENT_LEFT":
        if (isLeavingRef.current) {
          isLeavingRef.current = false;
          return;
        }

        setIsGameOver(true);
        break;

      case "GAME_UPDATE":
        setState(event.payload.state);
        console.log("NEW FEN:", event.payload.state.fen);
        break;

      case "GAME_OVER":
        setIsGameOver(true);
        break;

      case "ERROR":
        notify(event.payload.message, "error");
        setErrorTick((prev) => prev + 1);
        break;
    }
  };

  return (
    <GameContext.Provider
      value={{ state, gameId, color, playerId, isGameOver, send, leaveGame, errorTick }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
};
