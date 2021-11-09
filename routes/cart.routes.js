const express = require('express');
const router = express.Router({ mergeParams: true });
const cartController = require('./../controllers/cart.controller');
const authController = require('./../controllers/auth.controller');

router.use(authController.protect, authController.restrictTo('user'));
router.route('/').post(cartController.addItem);

router
  .route('/')
  .patch(cartController.updateItem)
  .delete(cartController.removeItem);

router.route('/:id').get(cartController.getCart);

module.exports = router;
