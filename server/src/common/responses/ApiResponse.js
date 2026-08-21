const responseMetadata = (request) => ({
  requestId: request?.id,
  timestamp: new Date().toISOString(),
});

export class ApiResponse {
  constructor(
    statusCode = 200,
    data = null,
    message = "Success",
    meta = undefined,
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }

  toJSON(request) {
    return {
      success: true,
      message: this.message,
      data: this.data,
      ...(this.meta === undefined ? {} : { meta: this.meta }),
      ...responseMetadata(request),
    };
  }

  send(response) {
    return response.status(this.statusCode).json(this.toJSON(response.req));
  }

  static success(
    response,
    {
      statusCode = 200,
      message = "Success",
      data = null,
      meta = undefined,
    } = {},
  ) {
    return new ApiResponse(statusCode, data, message, meta).send(response);
  }

  static failure(
    response,
    {
      statusCode = 500,
      code = "INTERNAL_SERVER_ERROR",
      message,
      details = undefined,
    } = {},
  ) {
    return response.status(statusCode).json({
      success: false,
      error: {
        code,
        message: message ?? "An unexpected error occurred",
        ...(details === undefined ? {} : { details }),
      },
      ...responseMetadata(response.req),
    });
  }
}

export default ApiResponse;
