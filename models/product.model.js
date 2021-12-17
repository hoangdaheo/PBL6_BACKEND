const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'A product must have a name'],
      unique: true,
      trim: true,
    },
    slug: String,
    imageCover: {
      type: String,
      required: [true, 'A product must have a cover image'],
    },
    images: [String],
    brand: {
      type: String,
      required: [true, 'A product must have a brand name'],
    },
    sku: {
      type: String,
      required: [true, 'A product must have a SKU'],
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price {{VALUE}} should be below regular price',
      },
    },
    // productManagement: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Size',
    //   },
    // ],
    // countInStock: {
    //   type: Number,
    //   require: true,
    //   default: 0,
    // },
    // isOutOfStock: {
    //   type: Boolean,
    //   require: true,
    //   default: false,
    // },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
