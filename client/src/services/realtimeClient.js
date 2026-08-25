import { io } from "socket.io-client";

export const createRealtimeSocket = (token) => {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  return io(baseUrl, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
};