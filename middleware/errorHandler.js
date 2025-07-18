function errorHandler(err, req, res, next) {
  const status = err.status || 400;
  console.log(err); // Log the error for debugging
  res.status(status).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler; 