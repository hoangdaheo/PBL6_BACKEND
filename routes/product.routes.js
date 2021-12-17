const express = require('express');
const router = express.Router();
const productController = require('./../controllers/product.controller');
const cartRouter = require('./cart.routes');
const authController = require('./../controllers/auth.controller');
const reviewRouter = require('./review.routes');

router.use('/:productId/cart', cartRouter);
router.use('/:productId/reviews', reviewRouter);

router
  .route('/')
  .get(productController.getProducts)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    productController.createProduct
  );

router
  .route('/:id/size/')
  .get(productController.getAllSizeInProduct)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    productController.createSizeAndQty
  );

router
  .route('/:id/size/:size')
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    productController.updateQty
  );

router
  .route('/:id')
  .get(productController.getProductById)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    productController.uploadProductImages,
    productController.resizeTourImages,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    productController.deleteProduct
  );
module.exports = router;
