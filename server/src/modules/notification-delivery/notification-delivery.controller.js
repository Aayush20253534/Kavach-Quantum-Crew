import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { notificationDeliveryService } from "./notification-delivery.service.js";

const send = (response, data, message = "Notification delivery operation completed") =>
  ApiResponse.success(response, { data, message });

export const createNotificationDeliveryController = ({ service = notificationDeliveryService } = {}) => ({
  capabilities(request, response) {
    return send(response, service.capabilities(request.user), "Delivery capabilities retrieved");
  },
  async enqueue(request, response) {
    return send(
      response,
      await service.enqueue(request.user, request.params.notificationId, request.body),
      "Notification deliveries enqueued",
    );
  },
  async list(request, response) {
    return send(response, await service.list(request.user, request.query), "Notification deliveries retrieved");
  },
  async get(request, response) {
    return send(response, await service.get(request.user, request.params.deliveryId), "Notification delivery retrieved");
  },
  async retry(request, response) {
    return send(response, await service.retry(request.user, request.params.deliveryId), "Notification delivery requeued");
  },
  async processDue(request, response) {
    return send(response, await service.processDue(request.user, request.body), "Due notification deliveries processed");
  },
});

export const notificationDeliveryController = createNotificationDeliveryController();

export default notificationDeliveryController;
