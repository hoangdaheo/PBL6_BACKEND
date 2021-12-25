const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Order = require('./../models/order.model');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
  const { shippingAddress } = req.body;

  const order = await Order.create({
    user,
    orderItems,
    totalPrice,
    shippingAddress,
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
      id: req.user.id,
      status: req.body.status,
      update_time: Date.now(),
      email_address: req.user.email,
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

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get the currently booked tour
  const order = await Order.findById(req.params.orderId);
  if (order.isPaid || order.isCanceled) {
    return next(new AppError('Order was paid or cancelled!', 404));
  }
  // 2) create checkout session
  if (order.pendingTime > Date.now()) {
    return next(new AppError('User is paying!', 400));
  }
  const timeout = Number.parseInt(Date.now() / 1000) + 60 * 61;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    // cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    success_url: `http://localhost:3000`,
    cancel_url: `http://localhost:3000`,
    customer_email: req.user.email,
    expires_at: timeout,
    client_reference_id: req.params.orderId,
    line_items: order.orderItems.map((item) => {
      return {
        name: item.name,
        description: item.size,
        images: [item.image],
        amount: item.price * 100,
        currency: 'usd',
        quantity: item.qty,
      };
    }),
  });
  order.pendingTime = Date.now() + 1000 * 90;
  await order.save({ validateBeforeSave: false });
  // 3) create session as res
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createOrderCheckout = async (session) => {
  const orderId = session.client_reference_id;
  const order = await Order.findById(orderId);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    await order.save({ validateBeforeSave: false });
  }
};
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    ); //string raw form
  } catch (error) {
    return res.status(400).send(`WebHook error: ${error.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    createOrderCheckout(event.data.object);
  }
  res.status(200).json({ received: true });
};

exports.getOneOrder = factory.getOne(Order);
