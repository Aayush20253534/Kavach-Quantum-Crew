import { z } from "zod";
export const notificationParamsSchema=z.object({notificationId:z.string().uuid()});
export const notificationQuerySchema=z.object({unreadOnly:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).default(false),limit:z.coerce.number().int().min(1).max(100).default(50)});
