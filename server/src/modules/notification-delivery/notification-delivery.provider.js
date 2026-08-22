export class DeliveryProviderError extends Error {
  constructor(message, { code = "DELIVERY_PROVIDER_ERROR", retryable = false } = {}) {
    super(message);
    this.name = "DeliveryProviderError";
    this.code = code;
    this.retryable = retryable;
  }
}

const builtinInApp = async () => ({
  provider: "IN_APP",
  externalId: null,
});

export const createNotificationDeliveryProvider = ({ handlers = {} } = {}) => ({
  async send(channel, payload) {
    if (channel === "IN_APP") return builtinInApp(payload);

    const handler = handlers[channel];
    if (!handler) {
      throw new DeliveryProviderError(
        `${channel} delivery provider is not configured`,
        { code: "DELIVERY_PROVIDER_NOT_CONFIGURED", retryable: false },
      );
    }

    return handler(payload);
  },

  capabilities() {
    return {
      IN_APP: true,
      EMAIL: Boolean(handlers.EMAIL),
      SMS: Boolean(handlers.SMS),
      PUSH: Boolean(handlers.PUSH),
      WHATSAPP: Boolean(handlers.WHATSAPP),
    };
  },
});

export const notificationDeliveryProvider = createNotificationDeliveryProvider();

export default notificationDeliveryProvider;
