import { environment } from "./environment.js";

export const helmetOptions = Object.freeze({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "no-referrer" },
});

export const bodyParserOptions = Object.freeze({
  limit: environment.JSON_BODY_LIMIT,
  strict: true,
  type: "application/json",
});

export const urlEncodedParserOptions = Object.freeze({
  extended: false,
  limit: environment.JSON_BODY_LIMIT,
  parameterLimit: 1000,
});

export default {
  helmetOptions,
  bodyParserOptions,
  urlEncodedParserOptions,
};
