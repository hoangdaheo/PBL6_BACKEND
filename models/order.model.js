const mongoose = require('mongoose');
const Size = require('./size.model');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const CartItem = require('./cartItem.model');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'An order must have user'],
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        size: { type: String, require: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    isCanceled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.post('save', async function () {
  const { isCanceled } = this;
  await Promise.all(
    this.orderItems.map(async (item) => {
      // 1) get the size and qty dataset
      const doc = await Size.findOne({
        size: item.size,
        product: item.product,
      });
      // 2) subtract/add qty for each size
      if (isCanceled) {
        doc.quantity += item.qty;
      } else {
        doc.quantity -= item.qty;
        // subfeature: get the item have userQuantity > productQuantity
        await CartItem.updateMany(
          {
            product: item.product,
            userSize: item.size,
            userQuantity: { $gt: doc.quantity },
          },
          {
            userQuantity: doc.quantity,
          }
        );
        // subfeature: updateMany: userQTY = productQTY
      }
      // 3) save to dbs
      await doc.save();
    })
  );
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
