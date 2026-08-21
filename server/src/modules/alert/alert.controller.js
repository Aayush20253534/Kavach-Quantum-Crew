import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { alertService } from "./alert.service.js";
export const createAlertController=({service=alertService}={})=>({list:async(r,s)=>ApiResponse.success(s,{message:"Safety alerts",data:await service.list(r.user.id,r.query)}),get:async(r,s)=>ApiResponse.success(s,{message:"Safety alert",data:await service.get(r.user.id,r.params.alertId)}),acknowledge:async(r,s)=>ApiResponse.success(s,{message:"Safety alert acknowledged",data:await service.acknowledge(r.user.id,r.params.alertId)}),resolve:async(r,s)=>ApiResponse.success(s,{message:"Safety alert resolved",data:await service.resolve(r.user.id,r.params.alertId)})});
export const alertController=createAlertController(); export default alertController;
