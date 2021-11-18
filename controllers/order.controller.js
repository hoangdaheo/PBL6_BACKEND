const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Order = require('./../models/order.model');
const factory = require('./handlerFactory');

function priceHandler(accumulator, currentValue) {
  return accumulator + currentValue.price * currentValue.qty;
}
function qtyHandler(accumulator, currentValue) {
  return accumulator + currentValue.qty;
}

// Admin
exports.createOrder = catchAsync(async (req, res, next) => {
  // 1) get the user id
  const user = req.user.id;

  // 2) get cart items and process to order item
  const orderItems = req.orderItems;
  // 3) total price
  let totalPrice = orderItems.reduce(priceHandler, 0);
  const totalQty = orderItems.reduce(qtyHandler, 0);
  let shippingPrice;
  if (totalQty < 10) {
    shippingPrice = 20 + (15 * totalPrice) / 100;
  } else if (totalQty > 10 && totalQty < 50) {
    shippingPrice = 50 + (14 * totalPrice) / 100;
  } else if (totalQty > 50) {
    shippingPrice = 90 + (12 * totalPrice) / 100;
  }
  totalPrice = totalPrice + shippingPrice;
  const { shippingAddress, paymentMethod } = req.body;

  const order = await Order.create({
    user,
    orderItems,
    totalPrice,
    shippingAddress,
    paymentMethod,
    totalPrice,
    shippingPrice,
  });
  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
  });
});
// Admin/ User
exports.cancelOrder = catchAsync(async (req, res, next) => {
  // 1) get user order
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order is wrong!', 400));
  // 2) if isPaid => cannot cancel
  if (order.isPaid) return next(new AppError('Cannot cancel paid order!', 404));
  // 3) update order isCanceled field => true
  order.isCanceled = true;
  order.save();
  // 4) add the qty to Size=>quantity
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});
exports.updateOrder = factory.updateOne(Order);

// User/ Admin
exports.getAllOrders = factory.getAll(Order);
exports.getMyOrder = catchAsync(async (req, res, next) => {
  const order = await Order.find({ user: req.user.id });
  res.status(200).json({
    status: 'success',
    results: order.length,
    data: {
      order,
    },
  });
});
exports.updateOrderToPaid = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } else {
    return next(new AppError('Order not found!', 404));
  }
});
exports.updateOrderToDelivered = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } else {
    return next(new AppError('Order not found', 404));
  }
});
