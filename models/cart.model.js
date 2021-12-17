const mongoose = require('mongoose');

const cartSchema = mongoose.Schema(
  {
    cartItem: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'CartItem',
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
