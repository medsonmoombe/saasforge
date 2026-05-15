import nodemailer from "nodemailer";

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASSWORD! },
  });

  await transporter.verify();
  console.log("✅ SMTP connection verified — ready to send emails");
  process.exit(0);
}

main().catch(err => { console.error("❌ SMTP error:", err.message); process.exit(1); });
