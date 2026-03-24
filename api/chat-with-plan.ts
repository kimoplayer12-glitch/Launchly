// OpenAI integration removed. This endpoint is disabled to avoid any
// usage of OpenAI API keys. Use the server-side route at
// `/api/chat-with-plan` (Express) which returns demo responses instead.

export default function handler(_req: any, res: any) {
  res.status(410).json({
    error: "OpenAI integration removed",
    message: "This endpoint has been disabled. Use the server-side demo route instead.",
  });
}
