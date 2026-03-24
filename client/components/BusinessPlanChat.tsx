import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader, Lightbulb, CornerDownLeft } from "lucide-react";
import { toast } from "./ui/use-toast";
import { readJson } from "@/lib/api-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BusinessPlanChatProps {
  plan?: string;
  businessName?: string;
  onClose?: () => void;
}

const STARTER_PROMPTS = [
  { icon: "📋", text: "Create an executive summary", color: "from-neon-cyan/20" },
  { icon: "🎯", text: "Help me define my target market", color: "from-neon-purple/20" },
  { icon: "💰", text: "Build financial projections", color: "from-neon-cyan/20" },
  { icon: "🚀", text: "Develop a launch strategy", color: "from-green/20" },
];

export default function BusinessPlanChat({
  plan = "",
  businessName = "Your Business",
  onClose,
}: BusinessPlanChatProps) {
  const initialWelcome = plan && plan.trim()
    ? `Hi! 👋 I'm your AI business advisor. I've reviewed your business plan for **${businessName}**. I'm here to help you refine, improve, and execute your strategy. \n\nFeel free to ask me anything about your plan, or request improvements to specific sections. How can I help you today?`
    : `Hi! 👋 I'm your AI business advisor. I'm here to help you build a comprehensive business plan from scratch.\n\nTell me about your business idea, and I'll guide you through creating an executive summary, market analysis, financial projections, and strategic milestones.`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: initialWelcome,
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-with-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          businessPlan: plan,
          businessName,
        }),
      });
      const data = await readJson<{ response?: string; error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error || "AI adviser is unavailable.");
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry — the AI adviser is unavailable right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      toast({
        title: "AI Adviser Unavailable",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleStarterPrompt = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-card to-background rounded-xl border border-border overflow-hidden shadow-xl">
      {/* Messages Container - Full Height with Scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
        {messages.length === 1 && !isLoading ? (
          // Initial state with starter prompts
          <>
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-neon-cyan" />
                </div>
                <div className="bg-white/5 border border-white/20 px-4 py-3 rounded-lg flex-1">
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Starter Prompts */}
            <div className="mt-8 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-neon-cyan" />
                <p className="text-xs text-foreground/60 font-semibold">QUICK PROMPTS</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleStarterPrompt(prompt.text)}
                    className={`p-3 rounded-lg bg-gradient-to-r ${prompt.color} to-transparent border border-white/10 hover:border-neon-cyan/50 transition-all text-left group`}
                  >
                    <p className="text-2xl mb-1">{prompt.icon}</p>
                    <p className="text-sm font-medium text-foreground group-hover:text-neon-cyan transition-colors">
                      {prompt.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Regular chat messages
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-neon-cyan" />
                </div>
              )}

              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-neon-cyan/20 border border-neon-cyan/50 text-foreground"
                    : "bg-white/5 border border-white/20 text-foreground/90"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-neon-purple" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center flex-shrink-0">
              <Loader className="w-4 h-4 text-neon-cyan animate-spin" />
            </div>
            <div className="bg-white/5 border border-white/20 px-4 py-3 rounded-lg">
              <p className="text-sm text-foreground/60 animate-pulse">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - Sticky Bottom */}
      <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI advisor anything..."
              disabled={isLoading}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm placeholder:text-foreground/40 disabled:opacity-50 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/20 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="btn-neon px-4 py-3 rounded-lg inline-flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-cyan/50 transition-all"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-semibold">Send</span>
            </button>
          </div>
          <p className="text-xs text-foreground/40 flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            Press Enter to send
          </p>
        </form>
      </div>
    </div>
  );
}
