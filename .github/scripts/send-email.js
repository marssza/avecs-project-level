const nodemailer = require("nodemailer");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const textBody = fs.readFileSync("report.txt", "utf8");
const htmlBody = fs.readFileSync("report.html", "utf8");

transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: process.env.REPORT_RECIPIENT,
  subject: "Weekly Avecs Support Board Report",
  text: textBody,
  html: htmlBody,
}, (err, info) => {
  if (err) {
    console.error("Failed to send email:", err);
    process.exit(1);
  }
  console.log("Email sent:", info.response);
});
