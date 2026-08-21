import { incidentService } from "../incident/incident.service.js";
export const createDisasterManagementService=({incidents=incidentService}={})=>Object.freeze({queue:(a,q)=>incidents.listQueue(a,q),get:(a,id)=>incidents.get(a,id),acknowledge:(a,id,n)=>incidents.acknowledge(a,id,n),start:(a,id,n)=>incidents.startResponse(a,id,n),resolve:(a,id,n)=>incidents.resolve(a,id,n)});
export const disasterManagementService=createDisasterManagementService(); export default disasterManagementService;
