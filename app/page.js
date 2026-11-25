"use client";

import { useEffect, useRef, useState } from "react";
import { useTempsAnalytics } from "@temps-sdk/react-analytics";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const { trackEvent } = useTempsAnalytics();

  function track(name, data = {}) {
    // Analytics must never interrupt the chat experience.
    Promise.resolve(trackEvent(name, data)).catch(() => {});
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    if (messages.length === 0) track("chat_started");
    track("message_sent", { message_count: next.length });

    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
      track("response_received", {
        message_count: next.length + 1,
        latency_ms: Date.now() - startedAt,
      });
    } catch (err) {
      setError(err.message);
      track("chat_error", { error_type: "request_failed" });
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    if (messages.length > 0) track("conversation_cleared", { message_count: messages.length });
    setMessages([]);
    setError("");
  }

  return (
    <main className="chat">
      <header className="header">
        <h1>💬 Simple Chatbot</h1>
        <button className="ghost" onClick={clearConversation}>
          Clear
        </button>
      </header>

      <div className="messages rr-block">
        {messages.length === 0 && (
          <p className="empty">Say hello to start the conversation.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="bubble assistant typing">Thinking…</div>}
        {error && <div className="error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form className="composer rr-block" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}
