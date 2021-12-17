const mongoose = require('mongoose');

const sizeSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  size: {
    type: String,
    required: [true, 'Size is require'],
    trim: true,
    enum: {
      values: ['s', 'm', 'l', 'xl'],
      mesasge: 'Wrong size (S,M,L,XL)',
    },
  },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
    min: [0, 'Min value is 0'],
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
});
// Its make 1:product have 4:sizes, no duplicate with 4 size in 1 certain product
sizeSchema.index({ product: 1, size: 1 }, { unique: true });
// sizeSchema.post(/^findOneAnd/,function(){

// })
const Size = mongoose.model('Size', sizeSchema);

module.exports = Size;
