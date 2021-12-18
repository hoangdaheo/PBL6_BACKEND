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
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const orderController = require('./controllers/order.controller');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(cors());
app.use(helmet());
// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.options('*', cors());
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  orderController.webhookCheckout
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);
//Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/reviews', reviewRouter);
app.get('/', function (req, res) {
  res.send('Backend Server for PBL6');
});
app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server`));
});
app.use(globalErrorHandler);

module.exports = app;
