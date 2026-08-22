import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { chatbotController } from "./chatbot.controller.js";
import { chatbotMessageBodySchema } from "./chatbot.validation.js";

export const createChatbotRouter = ({ controller = chatbotController } = {}) => {
  const router = Router();

  router.use(authenticate, authorize(ROLES.TOURIST));
  router.post(
    "/messages",
    validate({ body: chatbotMessageBodySchema }),
    asyncHandler(controller.sendMessage),
  );

  return router;
};

export const chatbotRouter = createChatbotRouter();
export default chatbotRouter;
