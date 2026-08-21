let socketServer = null;

export const setLocationSocketServer = (io) => {
  socketServer = io ?? null;
};

export const locationPublisher = Object.freeze({
  publishLocationUpdated({ tripId, groupId, userId, location }) {
    if (!socketServer) return;
    const payload = { tripId, userId, location };
    socketServer.to(`trip:${tripId}`).emit("location:updated", payload);
    if (groupId) socketServer.to(`group:${groupId}`).emit("location:updated", payload);
    socketServer.to(`tourist:${userId}`).emit("location:updated", payload);
  },
});
