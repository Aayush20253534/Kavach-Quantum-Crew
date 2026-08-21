export const asyncHandler = (handler) =>
  function wrappedAsyncHandler(request, response, next) {
    return Promise.resolve(handler.call(this, request, response, next)).catch(
      next,
    );
  };

export default asyncHandler;
