require('dotenv').config({ path: './../config.env' });
const { promisify } = require('util');
const cloudinary = require('cloudinary').v2;
let streamifier = require('streamifier');
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

console.log('Cloudinary connect:', cloudinary.config().cloud_name);

exports.cloudUpload = (file, public_id) => {
  let cld_upload_stream = cloudinary.uploader.upload_stream(
    {
      public_id: public_id,
      use_filename: true,
    },
    function (error, result) {
      if (error) {
        console.log(error);
      }
    }
  );
  streamifier.createReadStream(file).pipe(cld_upload_stream);
  // return new Promise(function (res, rej) {
  //   let cld_upload_stream = cloudinary.uploader.upload_stream(
  //     {
  //       folder: 'foo',
  //     },
  //     function (error, result) {
  //       if (error) {
  //         rej(error);
  //       } else {
  //         res(result);
  //       }
  //       // console.log(error, result);
  //     }
  //   );
  //   streamifier.createReadStream(file).pipe(cld_upload_stream);
  // });
};
