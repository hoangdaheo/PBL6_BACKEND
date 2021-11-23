const express = require('express');
const morgan = require('morgan');
const userRouter = require('./routes/user.routes');
const productRouter = require('./routes/product.routes');
const orderRouter = require('./routes/order.routes');
const cartRouter = require('./routes/cart.routes');
const reviewRouter = require('./routes/review.routes');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error.controller');
const cors = require('cors');
const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// Middleware
app.use(morgan('dev'));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/reviews', reviewRouter);
app.get('/', function (req, res) {
  res.send('hello');
});
app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server`));
});
app.use(globalErrorHandler);

module.exports = app;
