import { database } from "../../config/database.js";

export const createHealthRepository = ({ db = database } = {}) =>
  Object.freeze({
    checkDatabase: () => db.ping(),
  });

export const healthRepository = createHealthRepository();

export default healthRepository;
