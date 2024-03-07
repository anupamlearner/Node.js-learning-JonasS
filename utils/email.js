const nodemailer = require("nodemailer");
const catchAsync = require("./catchAsync");

/*
const sendEmail = catchAsync(async (options) => {
  // 1 Create transporter
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  // 2 Define email options
  const mailOptions = {
    from: "Jonas Schmedtman <hello@jonas.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // HTML
  };
  await transport.sendMail(mailOptions);
});
*/

// /*
const sendEmail = catchAsync(async (options) => {
  // 1 Create transporter
  const transport = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });
  // 2 Define email options
  const mailOptions = {
    from: "Jonas Schmedtman <hello@jonas.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // HTML
  };
  await transport.sendMail(mailOptions);
});
// */
module.exports = sendEmail;
