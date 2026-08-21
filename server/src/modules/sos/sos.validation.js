import { z } from "zod";
const uuid=z.string().uuid();
export const sosParamsSchema=z.object({sosId:uuid});
export const createSosBodySchema=z.object({tripId:uuid,emergencyType:z.enum(["MEDICAL","LOST","THREAT","ACCIDENT","NATURAL_DISASTER","OTHER"]),message:z.string().trim().min(2).max(500).optional(),latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional(),accuracyM:z.number().positive().max(5000).optional()}).superRefine((v,c)=>{if((v.latitude!==undefined)!==(v.longitude!==undefined))c.addIssue({code:"custom",path:[v.latitude!==undefined?"longitude":"latitude"],message:"latitude and longitude must be provided together"});});
