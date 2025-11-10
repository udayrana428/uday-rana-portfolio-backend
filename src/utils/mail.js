import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Initialize mailgen instance with default theme and brand configuration
  const mailGenerator = new Mailgen({
    // Mailgen supports "salted", "neopolitan", "cerberus" themes.
    theme: "salted",
    product: {
      name: "Uday Rana",
      link: "https://uday-rana-portfolio.vercel.app",
    },
  });

  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

  // Generate an HTML email with the provided contents
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  // Create nodemailer transporter instance
  const transporter = nodemailer.createTransport({
    // Use Mailtrap for development
    // Use Gmail only for small-scale sending
    // Use SendGrid / AWS SES / Resend / Mailgun for production apps

    // host: process.env.MAILTRAP_SMTP_HOST || "smtp.mailtrap.io",
    // port: process.env.MAILTRAP_SMTP_PORT || 2525,

    // secure: false,

    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mail = {
    from: `"Uday Rana" <${process.env.GMAIL_USER}>`, // Updated from field
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email service failed:", error);
    throw error; // Changed to throw error for better error handling
  }
};

const sendContactEmailToAdminMailgenContent = (data) => ({
  body: {
    name: "Uday Rana",
    intro: "📩 You’ve received a new message from your portfolio contact form!",
    table: {
      data: [
        {
          "Sender Name": data.name,
          "Sender Email": data.email,
          Message: data.message,
        },
      ],
      columns: {
        customWidth: {
          "Sender Name": "20%",
          "Sender Email": "20%",
          Message: "60%",
        },
      },
    },
    outro:
      "You can reply directly to the sender’s email address to continue the conversation.",
  },
});

const sendContactEmailToUserMailgenContent = (data) => ({
  body: {
    name: data.name,
    intro: `Hi ${data.name}, thank you for reaching out! 👋`,
    message:
      "I’ve received your message and appreciate you taking the time to contact me.",
    action: {
      instructions:
        "In the meantime, feel free to explore my portfolio or connect with me online:",
      button: {
        color: "#FEF08A",
        text: "Visit My Portfolio",
        link: "https://uday-rana-portfolio.vercel.app",
      },
    },
    outro:
      "I will get back to you as soon as possible. Have a great day!\n\n— Uday Rana",
  },
});

export {
  sendEmail,
  sendContactEmailToAdminMailgenContent,
  sendContactEmailToUserMailgenContent,
};
