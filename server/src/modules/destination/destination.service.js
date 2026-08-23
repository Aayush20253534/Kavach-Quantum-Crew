import { destinationRepository } from "./destination.repository.js";

export const createDestinationService = ({ repository = destinationRepository } = {}) => ({
  list(query) {
    return repository.list(query);
  },
});

export const destinationService = createDestinationService();
export default destinationService;
