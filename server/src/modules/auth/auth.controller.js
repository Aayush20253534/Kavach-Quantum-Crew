import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { environment } from "../../config/environment.js";
import { authService } from "./auth.service.js";

const requestContext = (request) => ({
  userAgent: request.get("user-agent"),
  ipAddress: request.ip,
});

const refreshCookieOptions = (config = environment) => ({
  httpOnly: true,
  secure: config.REFRESH_COOKIE_SECURE,
  sameSite: config.REFRESH_COOKIE_SAME_SITE,
  path: `${config.API_PREFIX}/auth`,
  maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});

const clearRefreshCookieOptions = (config = environment, path) => ({
  httpOnly: true,
  secure: config.REFRESH_COOKIE_SECURE,
  sameSite: config.REFRESH_COOKIE_SAME_SITE,
  path,
});

const sendAuth = (response, result, { statusCode = 200, message }) => {
  response.cookie(
    environment.REFRESH_COOKIE_NAME,
    result.refreshToken,
    refreshCookieOptions(),
  );
  return ApiResponse.success(response, {
    statusCode,
    message,
    data: { user: result.user, accessToken: result.accessToken },
  });
};

export const createAuthController = ({ service = authService } = {}) => ({
  usernameAvailability: async (request, response) =>
    ApiResponse.success(response, {
      message: "Username availability",
      data: await service.checkUsernameAvailability(request.query.username),
    }),

  register: async (request, response) => {
    const result = await service.register(request.body);
    return ApiResponse.success(response, {
      statusCode: 201,
      message: "Tourist account created. Verification code sent to email",
      data: result,
    });
  },

  verifyEmail: async (request, response) => {
    const result = await service.verifyEmail(
      request.body,
      requestContext(request),
    );
    return sendAuth(response, result, {
      message: "Email verified successfully",
    });
  },

  resendEmailVerification: async (request, response) =>
    ApiResponse.success(response, {
      message: "If the account is awaiting verification, a code has been sent",
      data: await service.resendEmailVerification(request.body),
    }),

  login: async (request, response) => {
    const result = await service.login(request.body, requestContext(request));
    return sendAuth(response, result, { message: "Signed in successfully" });
  },

  refresh: async (request, response) => {
    const token =
      request.cookies?.[environment.REFRESH_COOKIE_NAME] ??
      request.body.refreshToken;
    const result = await service.refresh(token);
    return sendAuth(response, result, { message: "Session refreshed" });
  },

  logout: async (request, response) => {
    const token =
      request.cookies?.[environment.REFRESH_COOKIE_NAME] ??
      request.body.refreshToken;
    await service.logout(token);
    // Do not pass the login cookie's positive maxAge to clearCookie. Clear
    // both the current auth-scoped cookie and a possible legacy root cookie.
    response.clearCookie(
      environment.REFRESH_COOKIE_NAME,
      clearRefreshCookieOptions(environment, `${environment.API_PREFIX}/auth`),
    );
    response.clearCookie(
      environment.REFRESH_COOKIE_NAME,
      clearRefreshCookieOptions(environment, "/"),
    );
    return ApiResponse.success(response, { message: "Signed out successfully" });
  },

  me: async (request, response) =>
    ApiResponse.success(response, {
      message: "Authenticated account",
      data: await service.getMe(request.user.id, request.user.role),
    }),
});

export const authController = createAuthController();
export default authController;
