const express = require('express');
const router = express.Router();
const orderController = require('./../controllers/order.controller');
const authController = require('./../controllers/auth.controller');
const cartController = require('./../controllers/cart.controller');

router.use(authController.protect);
router
  .route('/')
  .get(orderController.getMyOrder)
  .post(cartController.removeItem, orderController.createOrder);
router.route('/:id').patch(orderController.cancelOrder);
router
  .route('/allOrder')
  .get(authController.restrictTo('admin'), orderController.getAllOrders);
router.route('/:id/pay').put(orderController.updateOrderToPaid);
router
  .route('/:id/deliver')
  .put(
    authController.restrictTo('admin'),
    orderController.updateOrderToDelivered
  );
module.exports = router;
