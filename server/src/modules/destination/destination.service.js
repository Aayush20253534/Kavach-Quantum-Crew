import { cacheGetOrSet } from "../../common/cache/cache.js";
import { environment } from "../../config/environment.js";
import { destinationRepository } from "./destination.repository.js";

const FALLBACK_DESTINATIONS = Object.freeze([
  {
    id: "fallback-prayagraj",
    slug: "prayagraj",
    name: "Prayagraj",
    state: "Uttar Pradesh",
    country: "India",
    latitude: 25.4358,
    longitude: 81.8463,
    description: "Historic pilgrimage city at the confluence of the Ganga, Yamuna and Saraswati.",
    imageUrl: null,
    featured: true,
    active: true,
    sortOrder: 1,
  },
  {
    id: "fallback-lucknow",
    slug: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    latitude: 26.8467,
    longitude: 80.9462,
    description: "Capital of Uttar Pradesh, known for heritage, culture and cuisine.",
    imageUrl: null,
    featured: true,
    active: true,
    sortOrder: 2,
  },
  {
    id: "fallback-kanpur",
    slug: "kanpur",
    name: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    latitude: 26.4499,
    longitude: 80.3319,
    description: "Major urban and industrial centre on the Ganga.",
    imageUrl: null,
    featured: true,
    active: true,
    sortOrder: 3,
  },
  {
    id: "fallback-delhi",
    slug: "delhi",
    name: "Delhi",
    state: "Delhi",
    country: "India",
    latitude: 28.6139,
    longitude: 77.209,
    description: "National capital territory with major heritage and tourist destinations.",
    imageUrl: null,
    featured: true,
    active: true,
    sortOrder: 4,
  },
]);

const fallbackList = ({ search, featured, limit }) => {
  const needle = search?.trim().toLowerCase();

  return FALLBACK_DESTINATIONS
    .filter((destination) => {
      if (featured !== undefined && destination.featured !== featured) return false;
      if (!needle) return true;

      return [destination.name, destination.state, destination.country]
        .some((value) => value.toLowerCase().includes(needle));
    })
    .slice(0, limit);
};

export const createDestinationService = ({
  repository = destinationRepository,
  logger = console,
} = {}) => ({
  async list(query) {
    try {
      const search = query.search?.trim().toLowerCase() || "all";
      const featured = query.featured === undefined ? "any" : String(query.featured);
      const limit = query.limit ?? 20;

      return await cacheGetOrSet({
        key: `destinations:list:${featured}:${limit}:${encodeURIComponent(search)}`,
        ttlSeconds: environment.REDIS_DESTINATIONS_TTL_SECONDS,
        fetcher: () => repository.list(query),
        logger,
      });
    } catch (error) {
      // Keep the dashboard usable if a deployment missed the destination migration.
      // The real fix is still `prisma migrate deploy`; this fallback prevents HTTP 500.
      logger.error?.("Destination query failed; using configured fallback destinations", error);
      return fallbackList(query);
    }
  },
});

export const destinationService = createDestinationService();
export default destinationService;
