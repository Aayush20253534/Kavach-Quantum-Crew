import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { groupService } from "./group.service.js";
export const createGroupController = ({ service = groupService } = {}) => ({
  create: async (req,res) => ApiResponse.success(res,{statusCode:201,message:"Group created",data:await service.createGroup(req.user.id,req.params.tripId)}),
  getById: async (req,res) => ApiResponse.success(res,{message:"Group",data:await service.getGroup(req.user.id,req.params.groupId)}),
  getByTrip: async (req,res) => ApiResponse.success(res,{message:"Trip group",data:await service.getTripGroup(req.user.id,req.params.tripId)}),
  invite: async (req,res) => ApiResponse.success(res,{statusCode:201,message:"Group invitation created",data:await service.createInvitation(req.user.id,req.params.groupId,req.body.expiresInMinutes)}),
  revokeInvite: async (req,res) => ApiResponse.success(res,{message:"Group invitation revoked",data:await service.revokeInvitation(req.user.id,req.params.groupId,req.params.invitationId)}),
  previewJoin: async (req,res) => ApiResponse.success(res,{message:"Group join preview",data:await service.previewJoinGroup(req.user.id,req.body.inviteToken)}),
  previewJoinByQr: async (req,res) => ApiResponse.success(res,{message:"Group QR join preview",data:await service.previewJoinGroupByHash(req.user.id,req.body.groupIdHash)}),
  join: async (req,res) => ApiResponse.success(res,{message:"Group joined",data:await service.joinGroup(req.user.id,req.body.inviteToken)}),
  joinByQr: async (req,res) => ApiResponse.success(res,{message:"Group joined",data:await service.joinGroupByHash(req.user.id,req.body.groupIdHash)}),
  leave: async (req,res) => ApiResponse.success(res,{message:"Group left",data:await service.leaveGroup(req.user.id,req.params.groupId)}),
  removeMember: async (req,res) => ApiResponse.success(res,{message:"Group member removed",data:await service.removeMember(req.user.id,req.params.groupId,req.params.memberId)}),
});
export const groupController = createGroupController();
