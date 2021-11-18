const multer = require('multer');
const sharp = require('sharp');
const Product = require('./../models/product.model');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const Size = require('./../models/size.model');
const cloudinary = require('./../utils/cloudinary');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image,please upload only image', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) cover image
  req.body.imageCover = `product/${req.params.id}-${Date.now()}-cover`;

  const imageCover = await sharp(req.files.imageCover[0].buffer)
    .resize(550, 550)
    .toFormat('jpeg')
    .jpeg({ quality: 5 })
    .toBuffer();
  // .toFile(`public/img/products/${req.body.imageCover}`);
  cloudinary.cloudUpload(imageCover, req.body.imageCover);
  req.body.imageCover =
    'https://res.cloudinary.com/dntc4uaqg/image/upload/' + req.body.imageCover;
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      let filename = `product/${req.params.id}-${Date.now()}-${index + 1}`;
      let image = await sharp(file.buffer)
        .resize(550, 550)
        .toFormat('jpeg')
        .jpeg({ quality: 5 })
        .toBuffer();
      // .toFile(`public/img/products/${filename}`);
      cloudinary.cloudUpload(image, filename);
      filename =
        'https://res.cloudinary.com/dntc4uaqg/image/upload/' + filename;
      req.body.images.push(filename);
    })
  );
  next();
});

exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.getProducts = factory.getAll(Product);
exports.getProductById = factory.getOne(Product, { path: 'reviews' });
exports.deleteProduct = factory.deleteOne(Product);
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);

exports.createSizeAndQty = catchAsync(async (req, res, next) => {
  // api/v1/products/:id/size
  // 1) get the product id
  const { id } = req.params;
  const { size, quantity, description } = req.body;
  // 2) add product id,size,qty to size dataset
  if (!(await Product.findById(id))) {
    return next(new AppError('Cannot find product!', 404));
  }
  // parent referencing
  const newSize = await Size.create({
    product: id,
    size,
    quantity,
    description,
  });
  res.status(201).json({
    status: 'success',
    data: {
      data: newSize,
    },
  });
});
exports.updateQty = catchAsync(async (req, res, next) => {
  // /products/:id/size/:size
  const { quantity, description } = req.body;
  const { id, size } = req.params;

  if (!(await Product.findById(id))) {
    return next(new AppError('Cannot find product!', 404));
  }
  const updatedSize = await Size.findOneAndUpdate(
    { product: id, size: size },
    { quantity, description },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedSize) {
    return next(new AppError('Please write the correct size', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: updatedSize,
    },
  });
});
exports.getAllSizeInProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!(await Product.findById(id))) {
    return next(new AppError('Cannot find product!', 404));
  }
  const sizeInProduct = await Size.find({ product: id });
  res.status(200).json({
    status: 'success',
    results: sizeInProduct.length,
    data: {
      data: sizeInProduct,
    },
  });
});
// => image XXXXX
// => static method => update when order created
// => populate certain size in 1 product // => product & size : parent ref => virtuals populate V
// => fixing auth V
