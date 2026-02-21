"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { ClientEvent, GameState, ServerEvent } from "@/types";
import { connectSocket, sendEvent } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useNotification } from "./notificationContext";

interface GameContextType {
  state: GameState | null;
  gameId: string | null;
  playerId: string | null;
  color: "w" | "b" | null;
  status: "error" | "waiting" | "playing" | "finished";
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
  const [status, setStatus] = useState<
    "error" | "waiting" | "playing" | "finished"
  >("waiting");

  const [errorTick, setErrorTick] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const isLeavingRef = useRef(false); // 👈 ADD THIS

  const leaveGame = () => {
    isLeavingRef.current = true;
    send({ type: "LEAVE_GAME", payload: {} });
  };

  useEffect(() => {
    const connect = () => {
      const socket = connectSocket((data: ServerEvent) => {
        handleServerEvent(data);
      });

      socketRef.current = socket;

      socket.onclose = () => {
        console.log("🔌 Socket closed. Reconnecting...");
        socketRef.current = null;

        // Auto reconnect after short delay
        setTimeout(connect, 1000);
      };
    };

    connect();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const send = (event: ClientEvent) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ Socket not connected");
      return;
    }

    socketRef.current.send(JSON.stringify(event));
  };

  const handleServerEvent = (event: ServerEvent) => {
    switch (event.type) {
      case "GAME_CREATED":
        setGameId(event.payload.gameId);
        setPlayerId(event.payload.playerId);
        setColor(event.payload.color);
        setState(event.payload.state);
        setStatus("waiting");
        router.push('/game');
        break;

      case "GAME_JOINED":
        setGameId(event.payload.gameId);
        setPlayerId(event.payload.playerId);
        setColor(event.payload.color);
        setState(event.payload.state);
        setStatus("playing");

        notify("Game started!", "success");
        router.push('/game');
        break;

      case "OPPONENT_LEFT":
        if (isLeavingRef.current) {
          // This was triggered by us leaving — ignore it
          isLeavingRef.current = false; // reset
          return;
        }

        notify(event.payload.message, "info");
        setState(null);
        setGameId(null);
        setColor(null);
        setStatus("finished");
        router.push("/");
        break;

      case "GAME_UPDATE":
        setState(event.payload.state);
        console.log("NEW FEN:", event.payload.state.fen);
        break;

      case "GAME_OVER":
        setStatus("finished")
        notify("Game over with a Checkmate!", "success")
        break;

      case "ERROR":
        notify(event.payload.message, "error");
        setErrorTick((prev) => prev + 1);
        setStatus("error");
        break;
    }
  };

  return (
    <GameContext.Provider
      value={{ state, gameId, color, playerId, status, send, leaveGame, errorTick }}
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
