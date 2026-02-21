import { ClientEvent } from "@/types";

let socket: WebSocket | null = null;

export const connectSocket = (onMessage: (data: any) => void) => {
    socket = new WebSocket(process.env.WEBSOCKET_URL ?? 'wss://chess-obqk.onrender.com');

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    socket.onclose = () => {
        console.log("socket closed");
    };

    return socket;
}

export const sendEvent = (event: ClientEvent) => {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
    } else {
        console.warn("Socket not ready");
    }
};