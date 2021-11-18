const CartItem = require('./../models/cartItem.model');
const Cart = require('./../models/cart.model');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const Product = require('../models/product.model');
const Size = require('../models/size.model');
function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}
exports.addItem = catchAsync(async (req, res, next) => {
  // :productId/cart/
  const productId = req.body.product ? req.body.product : req.params.productId;
  if (!productId) {
    return next(new AppError('Product is required', 404));
  }
  if (!(await Product.findById(productId))) {
    return next(new AppError('Can not find product', 404));
  }
  const { quantity, size } = req.body;

  const sizeAndQty = await Size.findOne({ product: productId, size: size });
  if (!sizeAndQty || !quantity || !size || sizeAndQty.quantity === 0) {
    return next(
      new AppError('Can not add to cart (Missing field or qty = 0)', 404)
    );
  }
  if (quantity > sizeAndQty.quantity) {
    return next(
      new AppError('Your Quantity can not higher than product quantity')
    );
  }
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({
      cartItem: [],
      user: req.user.id,
    });
  }
  const item = await CartItem.findOneAndUpdate(
    { product: productId, cart: cart.id, userSize: size },
    {
      userSize: size,
      userQuantity: quantity,
    },
    {
      new: true,
      upsert: true,
      rawResult: true,
    }
  );
  console.log('NEW DOC', item.lastErrorObject.updatedExisting);
  if (!item.lastErrorObject.updatedExisting) {
    cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: { cartItem: item.value._id },
      },
      {
        new: true,
      }
    );
    console.log('isnew', cart);
  } else {
    cart = await Cart.findOne({ user: req.user.id });
    console.log('ismodified', cart);
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: cart,
    },
  });
});
exports.removeItem = catchAsync(async (req, res, next) => {
  const cartItemArray = req.body.item;
  if (!cartItemArray) return next(new AppError('Item is require', 400));
  const cart = await Cart.findOne({ user: req.user.id });
  if (cart === null) return next(new AppError('User Cart is empty', 400));
  // const cartItemArray = cart.cartItem;
  cart.cartItem.pull(...cartItemArray);
  await cart.save();
  let orderItems = await Promise.all(
    cartItemArray.map(async (item) => {
      let cartItem = await CartItem.findById(item).populate('product');
      let doc = await Size.findOne({
        size: cartItem.userSize,
        product: cartItem.product.id,
      });
      console.log('cart.controller.js:88', doc.size);

      if (!cartItem) return false;
      if (doc.quantity < cartItem.userQuantity) {
        cartItem.userQuantity = doc.quantity;
      }
      if (cartItem.userQuantity === 0) return false;
      cartItem = {
        name: cartItem.product.name,
        qty: cartItem.userQuantity,
        size: cartItem.userSize,
        image: cartItem.product.imageCover,
        price: cartItem.product.price,
        product: cartItem.product.id,
      };
      await CartItem.findByIdAndDelete(item);
      return cartItem;
    })
  );
  orderItems = orderItems.filter((item) => item !== false);
  if (orderItems.length == 0)
    return next(new AppError('Order must have an item', 400));
  req.orderItems = orderItems;

  next();
});
exports.deleteItem = catchAsync(async (req, res, next) => {
  const cartItem = req.body.item;
  if (!cartItem) return next(new AppError('Item is require', 400));
  const cart = await Cart.findOne({ user: req.user.id });
  cart.cartItem.pull(cartItem);
  await cart.save();
  await CartItem.findByIdAndDelete(cartItem);
  res.status(204).json({
    status: 'success',
  });
});
exports.updateItem = catchAsync(async (req, res, next) => {
  const { id, size, quantity } = req.body;
  const cartItem = await CartItem.findById(id);
  if (!cartItem) {
    return next(new AppError('The item is not existed!', 404));
  }
  const productQuantity = (
    await Size.findOne({ product: cartItem.product, size: cartItem.userSize })
  ).quantity;
  if (productQuantity < quantity) {
    return next(
      new AppError('Your quantity can not higher than product quantity', 404)
    );
  }
  if (quantity < 0) {
    quantity = quantity * -1;
  }
  if (typeof quantity !== 'number' || isFloat(quantity)) {
    return next(new AppError('Wrong input', 404));
  }
  const updatedItem = await CartItem.findByIdAndUpdate(
    id,
    { userSize: size, userQuantity: quantity },
    { new: true, runValidators: true }
  );
  res.status(201).json({
    status: 'success',
    data: {
      data: updatedItem,
    },
  });
});
exports.getCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('cartItem');
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});
