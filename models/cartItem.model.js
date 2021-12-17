const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
  },
  cart: {
    type: mongoose.Schema.ObjectId,
    ref: 'Cart',
  },
  userSize: {
    type: String,
    required: [true, 'Please select your size'],
    enum: ['s', 'm', 'l', 'xl'],
  },
  userQuantity: {
    type: Number,
    required: [true, 'Please select quantity'],
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not a integer value',
    },
  },
});
cartItemSchema.pre(/^find/, function () {
  this.populate({
    path: 'product',
    select: '_id id name imageCover brand sku category price ',
  });
});
const CartItem = mongoose.model('CartItem', cartItemSchema);
module.exports = CartItem;
