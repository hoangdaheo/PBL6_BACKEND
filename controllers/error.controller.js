const appError = require('./../utils/appError');
//!start    Sending component  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const sendErrorProd = (err, res) => {
  // 1) Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // 2) Programing error or unknown error: do not leak error data
    console.error('ERROR ༼ つ ◕_◕ ༽つ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!!!',
    });
  }
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
//!end      Sending component --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//!start    API component --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// @desc    Error Controller, auto direct to this route if error is operation
// @route   *
// @access  Public
module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  // console.log(process.env.NODE_ENV);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // copy error object by using spread operator

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
//!end      API component --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//!start    Handle Error component --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new appError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg;
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new appError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new appError(message, 400);
};

const handleJWTError = () =>
  new appError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new appError('Your token has expired! Please log in again.', 401);

//!end      Handle Error component --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
