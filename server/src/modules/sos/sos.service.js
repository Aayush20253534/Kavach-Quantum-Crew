import { incidentService } from "../incident/incident.service.js";
export const createSosService=({incidents=incidentService}={})=>Object.freeze({trigger:(userId,input)=>incidents.triggerSos(userId,input),get:(actor,id)=>incidents.getSos(actor,id)});
export const sosService=createSosService(); export default sosService;
