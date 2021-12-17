const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Product = require('./../models/product.model');
const Review = require('./../models/review.model');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');

exports.setProductUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = catchAsync(async (req, res, next) => {
  if (!(await Product.findById(req.body.product))) {
    return next(new AppError('Product is not existed!', 400));
  }
  const doc = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
