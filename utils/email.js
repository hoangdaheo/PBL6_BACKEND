const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 465,
    secure: false,
    auth: {
      user: 'k3yboardhero@gmail.com',
      pass: 'hoangdaheo1',
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Shop-PBL6',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Send email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
