import { prisma } from "../../config/database.js";

export const credentialRepository = Object.freeze({
  findTrip(tripId) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        tourist: { select: { id: true, name: true, dateOfBirth: true, email: true, phone: true } },
        group: {
          include: { members: { where: { leftAt: null }, select: { userId: true } } },
        },
      },
    });
  },
  findUser(userId) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, dateOfBirth: true, email: true, phone: true } });
  },
  findIndividual(tripId, userId) {
    return prisma.touristTripCredential.findUnique({ where: { tripId_userId: { tripId, userId } } });
  },
  findIndividualById(id) {
    return prisma.touristTripCredential.findUnique({
      where: { id },
      include: { trip: { select: { id: true, locationName: true, status: true, plannedEndAt: true } } },
    });
  },
  findGroupCredential(groupId) {
    return prisma.groupTripCredential.findUnique({
      where: { groupId },
      include: {
        group: {
          include: {
            trip: { select: { id: true, locationName: true, status: true, plannedEndAt: true } },
            leader: { select: { id: true, name: true, email: true, phone: true } },
            members: { where: { leftAt: null }, include: { user: { select: { id: true, name: true, dateOfBirth: true, email: true, phone: true } } } },
          },
        },
      },
    });
  },
  findGroupCredentialById(id) {
    return prisma.groupTripCredential.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            trip: { select: { id: true, locationName: true, status: true, plannedEndAt: true } },
            leader: { select: { id: true, name: true, email: true, phone: true } },
            members: { where: { leftAt: null }, include: { user: { select: { id: true, name: true, dateOfBirth: true, email: true, phone: true } } } },
          },
        },
      },
    });
  },
  createIndividual(data) { return prisma.touristTripCredential.create({ data }); },
  createGroup(data) { return prisma.groupTripCredential.create({ data }); },
  updateIndividual(id, data) { return prisma.touristTripCredential.update({ where: { id }, data }); },
  updateGroup(id, data) { return prisma.groupTripCredential.update({ where: { id }, data }); },
  countSnapshotJobs(entityId) {
    return prisma.blockchainAnchorJob.count({ where: { entityId, operation: "SNAPSHOT" } });
  },
  listTripCredentials(tripId) {
    return Promise.all([
      prisma.touristTripCredential.findMany({ where: { tripId } }),
      prisma.groupTripCredential.findUnique({ where: { tripId } }),
    ]);
  },
});
