import { prisma } from "../../config/database.js";

export const createDestinationRepository = ({ db = prisma } = {}) => ({
  list({ search, featured, limit }) {
    return db.destination.findMany({
      where: {
        active: true,
        ...(featured === undefined ? {} : { featured }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
                { country: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: limit,
    });
  },
});

export const destinationRepository = createDestinationRepository();
export default destinationRepository;
