function errorHandler(err, req, res, next) {
  const status = err.status || 400;
  res.status(status).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler; 