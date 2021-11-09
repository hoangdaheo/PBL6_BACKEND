const CartItem = require('./../models/cartItem.model');
const Cart = require('./../models/cart.model');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const Product = require('../models/product.model');
const Size = require('../models/size.model');
function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}
exports.addItem = catchAsync(async (req, res, next) => {
  // :productId/cart/
  const { productId } = req.params;
  if (!productId) {
    return next(new AppError('Product is required', 404));
  }
  if (!(await Product.findById(productId))) {
    return next(new AppError('Can not find product', 404));
  }
  const { quantity, size } = req.body;

  const sizeAndQty = await Size.findOne({ product: productId, size: size });
  if (!sizeAndQty || !quantity || !size) {
    return next(new AppError('Can not add to cart', 404));
  }
  if (quantity > sizeAndQty.quantity) {
    return next(
      new AppError('Your Quantity can not higher than product quantity')
    );
  }
  console.log(req.user.id);
  let cart = await Cart.findOne({ user: '617418d4a9dfd144896cfa03' });
  if (!cart) {
    await Cart.create({
      cartItem: [],
      user: '617418d4a9dfd144896cfa03',
    });
  }
  const item = await CartItem.findOneAndUpdate(
    { product: productId, userSize: size },
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
  console.log(item.lastErrorObject.updatedExisting);
  if (!item.lastErrorObject.updatedExisting) {
    cart = await Cart.findOneAndUpdate(
      { user: '617418d4a9dfd144896cfa03' },
      {
        $push: { cartItem: item.value._id },
      },
      {
        new: true,
      }
    );
    console.log('isnew', cart);
  } else {
    cart = await Cart.findOne({ user: '617418d4a9dfd144896cfa03' });
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
  const cart = await Cart.findOne({ user: '617418d4a9dfd144896cfa03' });
  // const cartItemArray = cart.cartItem;
  cart.cartItem.pull(...cartItemArray);
  const removedItem = await cart.save();
  req.removedItem = removedItem;
  next();
  // res.status(204).json({
  //   status: 'success',
  // });
});
exports.updateItem = catchAsync(async (req, res, next) => {
  const { id, size, quantity } = req.body;
  const cartItem = await CartItem.findById(id);
  if (!cartItem) {
    return next(new AppError('The item is not existed!', 404));
  }
  const productQuantity = (await Size.findOne({ product: cartItem.product }))
    .quantity;
  console.log(productQuantity);
  if (productQuantity < quantity) {
    return next(
      new AppError('Your quantity can not higher than product quantity', 404)
    );
  }
  if (quantity < 0) {
    quantity = quantity * -1;
  }
  console.log(typeof quantity);
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
exports.getCart = factory.getOne(Cart, 'cartItem');
