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

const sendResetPasswordEmail = async (email, resetLink) => {
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
    subject: "Reset Your Password - Fix Hunger",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <h2 style="color: #4CAF50; text-align: center; margin-bottom: 20px; font-weight: bold;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Fix Hunger account. Please click the button below to secure your account and set a new password:</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" target="_blank" style="background-color: #4CAF50; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2); transition: all 0.2s;">
            Reset Password
          </a>
        </div>
        <p style="color: #555;">This link will remain active for <strong>15 minutes</strong>. If you did not request this change, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center; line-height: 1.5;">
          If the button above does not work, copy and paste the following URL into your web browser:<br>
          <a href="${resetLink}" style="color: #4CAF50; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="font-size: 12px; color: #999999; text-align: center; margin-top: 15px;">Fix Hunger Team</p>
      </div>
    `,
  });

  if (!process.env.EMAIL_USER) {
    console.log("-----------------------------------------");
    console.log("PASSWORD RESET LINK SENT TO: " + email);
    console.log("RESET LINK: " + resetLink);
    console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
    console.log("-----------------------------------------");
  }
};

module.exports = { sendVerificationEmail, sendAccountCreationEmail, sendResetPasswordEmail };
