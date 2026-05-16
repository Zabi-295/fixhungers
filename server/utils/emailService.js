const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, otp) => {
  // For testing, we use Ethereal (simulated email)
  let transporter;
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const info = await transporter.sendMail({
    from: '"Fix Hunger" <no-reply@fixhunger.com>',
    to: email,
    subject: "Your OTP for Fix Hunger",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Verify Your Account</h2>
        <p>Hello,</p>
        <p>Your 6-digit verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; border: 1px dashed #4CAF50;">
            ${otp}
          </span>
        </div>
        <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Fix Hunger Team</p>
      </div>
    `,
  });

  if (!process.env.EMAIL_USER) {
    console.log("-----------------------------------------");
    console.log("OTP SENT TO: " + email);
    console.log("OTP CODE: " + otp);
    console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");
  }
};

const sendAccountCreationEmail = async (email, name, password, role) => {
  let transporter;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const info = await transporter.sendMail({
    from: '"Fix Hunger" <no-reply@fixhunger.com>',
    to: email,
    subject: "Your Account has been Created - Fix Hunger",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Welcome to Fix Hunger!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>An Admin has created your account on the Fix Hunger platform as a <strong>${role}</strong>.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Login Details:</strong></p>
          <p style="margin: 0 0 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please log in and change your password immediately.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://fixhungers.vercel.app/login" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Fix Hunger Team</p>
      </div>
    `,
  });

  if (!process.env.EMAIL_USER) {
    console.log("ACCOUNT CREATION EMAIL SENT. Preview URL: " + nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendVerificationEmail, sendAccountCreationEmail };
