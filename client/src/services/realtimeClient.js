import { io } from "socket.io-client";

import { API_URL, getAccessToken } from "./apiClient";

const normalizeSocketOrigin = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "http://localhost:4000";
  }

  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return raw
      .replace(/\/api\/v1\/?$/i, "")
      .replace(/\/$/, "");
  }
};

export const getRealtimeSocketUrl = () =>
  normalizeSocketOrigin(
    import.meta.env.VITE_SOCKET_URL || API_URL
  );

export const createRealtimeSocket = (
  token = getAccessToken()
) => {
  const socketUrl = getRealtimeSocketUrl();

  if (import.meta.env.DEV) {
    console.log("[realtime] socket URL:", socketUrl);
  }

  return io(socketUrl, {
    auth: token ? { token } : {},

    transports: ["websocket", "polling"],

    withCredentials: true,

    autoConnect: false,

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 10000,
  });
};