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

// basic text -> html conversion
const htmlBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height:1.5;">
<pre style="
white-space: pre-wrap;
font-family: Consolas, monospace;
background:#f5f5f5;
padding:16px;
border-radius:8px;">
${textBody
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")}
</pre>
</body>
</html>
`;

transporter.sendMail(
{
  from: process.env.GMAIL_USER,
  to: process.env.REPORT_RECIPIENT,
  subject: "Weekly Avecs Support Board Report",
  text: textBody,
  html: htmlBody
},
(err, info) => {
  if (err) {
    console.error("Failed to send email:", err);
    process.exit(1);
  }

  console.log("Email sent:", info.response);
});
