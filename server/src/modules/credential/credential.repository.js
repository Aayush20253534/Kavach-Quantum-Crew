import { prisma } from "../../config/database.js";

export const credentialRepository = Object.freeze({
  findTrip(tripId) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        group: {
          include: { members: { where: { leftAt: null }, select: { userId: true } } },
        },
      },
    });
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
            members: { where: { leftAt: null }, select: { userId: true } },
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
            members: { where: { leftAt: null }, select: { userId: true } },
          },
        },
      },
    });
  },
  createIndividual(data) { return prisma.touristTripCredential.create({ data }); },
  createGroup(data) { return prisma.groupTripCredential.create({ data }); },
  updateIndividual(id, data) { return prisma.touristTripCredential.update({ where: { id }, data }); },
  updateGroup(id, data) { return prisma.groupTripCredential.update({ where: { id }, data }); },
  listTripCredentials(tripId) {
    return Promise.all([
      prisma.touristTripCredential.findMany({ where: { tripId } }),
      prisma.groupTripCredential.findUnique({ where: { tripId } }),
    ]);
  },
});
