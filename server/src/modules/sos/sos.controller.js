import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { sosService } from "./sos.service.js";
export const createSosController=({service=sosService}={})=>({trigger:async(r,s)=>ApiResponse.success(s,{statusCode:201,message:"SOS incident created",data:await service.trigger(r.user.id,r.body)}),get:async(r,s)=>ApiResponse.success(s,{message:"SOS request",data:await service.get(r.user,r.params.sosId)})});
export const sosController=createSosController(); export default sosController;
