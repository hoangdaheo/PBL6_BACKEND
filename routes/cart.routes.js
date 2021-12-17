const express = require('express');
const cartController = require('./../controllers/cart.controller');
const authController = require('./../controllers/auth.controller');

const router = express.Router({ mergeParams: true });

router.use(authController.protect, authController.restrictTo('user'));
router.route('/').post(cartController.addItem);

router
  .route('/')
  .get(cartController.getCart)
  .patch(cartController.updateItem)
  .delete(cartController.deleteItem);

// router.route('/:id').;

module.exports = router;
