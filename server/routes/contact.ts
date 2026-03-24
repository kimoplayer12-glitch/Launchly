import { RequestHandler } from "express";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const handleContact: RequestHandler = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body as ContactFormData;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Please provide name, email, subject, and message",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    console.log("Contact form submission:", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Thank you for contacting us. We'll get back to you soon.",
      reference: `ZENITH-${Date.now()}`,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to process contact form",
    });
  }
};
