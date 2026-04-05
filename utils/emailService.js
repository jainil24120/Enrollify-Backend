import axios from "axios";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log(`[EMAIL] Sending to: ${to} | Subject: ${subject}`);

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Enrollify",
          email: process.env.EMAIL_USER,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html || `<p>${text || ""}</p>`,
      },
      {
        headers: {
          "api-key": process.env.EMAIL_PASS,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[EMAIL] Sent successfully: ${response.data?.messageId}`);
    return response.data;
  } catch (error) {
    console.error(`[EMAIL] FAILED to: ${to} | Error:`, error.response?.data || error.message);
    return null;
  }
};
