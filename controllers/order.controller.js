const Order = require('./../models/order.model');
const factory = require('./handlerFactory');

// Admin
exports.createOrder = factory.createOne(Order);
// Admin/ User
exports.cancelOrder = factory.deleteOne(Order);
exports.updateOrder = factory.updateOne(Order);

// User/ Admin
exports.getAllOrders = factory.getAll(Order);
exports.getOrder = factory.getOne(Order);
