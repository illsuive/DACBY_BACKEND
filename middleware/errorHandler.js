

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected system error occurred on the server.";

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Malformed resource locator string query identifier: ${err.value}`;
  }

  console.error(`[ERROR EVENT] ${req.method} ${req.url} >> Message: ${message}`, err.stack);

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
