export const registerGroupGateway = (socket) => {
  socket.on("group:unsubscribe", async (payload = {}, acknowledge = () => {}) => {
    if (typeof payload.groupId !== "string" || !payload.groupId.trim()) {
      acknowledge({ ok: false, code: "GROUP_ID_REQUIRED" });
      return;
    }
    await socket.leave(`group:${payload.groupId.trim()}`);
    acknowledge({ ok: true, groupId: payload.groupId.trim() });
  });
};

export default registerGroupGateway;
