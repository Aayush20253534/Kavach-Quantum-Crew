import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { dispatchService } from "./dispatch.service.js";
export const createDispatchController = ({ service = dispatchService } = {}) => ({
  createUnit: async (req,res)=>ApiResponse.success(res,{statusCode:201,message:"Emergency unit created",data:await service.createUnit(req.user,req.body)}),
  listUnits: async (req,res)=>ApiResponse.success(res,{message:"Emergency units",data:await service.listUnits(req.user,req.query)}),
  setUnitStatus: async (req,res)=>ApiResponse.success(res,{message:"Emergency unit status updated",data:await service.setUnitStatus(req.user,req.params.unitId,req.body.status)}),
  create: async (req,res)=>ApiResponse.success(res,{statusCode:201,message:"Dispatch created",data:await service.create(req.user,req.params.incidentId,req.body)}),
  autoAssign: async (req,res)=>ApiResponse.success(res,{statusCode:201,message:`Nearest ${req.params.serviceType} unit auto-assigned`,data:await service.autoAssign(req.user,req.params.incidentId,req.params.serviceType,req.body)}),
  assign: async (req,res)=>ApiResponse.success(res,{message:"Dispatch unit assigned",data:await service.assign(req.user,req.params.dispatchId,req.body)}),
  transition: async (req,res)=>ApiResponse.success(res,{message:"Dispatch updated",data:await service.transition(req.user,req.params.dispatchId,req.body.status,req.body.note)}),
  get: async (req,res)=>ApiResponse.success(res,{message:"Dispatch",data:await service.get(req.user,req.params.dispatchId)}),
  listForIncident: async (req,res)=>ApiResponse.success(res,{message:"Incident dispatches",data:await service.listForIncident(req.user,req.params.incidentId)}),
});
export const dispatchController = createDispatchController();
