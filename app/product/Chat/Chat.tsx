"use client";

import { Message } from "@/app/product/Chat/Message";
import { MessageList } from "@/app/product/Chat/MessageList";
import { LoanRequestForm } from "@/app/product/Chat/LoanRequestForm";
import { LoanStatusDashboard } from "@/app/product/Chat/LoanStatusDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export function Chat({ viewer }: { viewer: Id<"users"> | null }) {
  const [newMessageText, setNewMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "loans">("loans");
  const messages = useQuery(api.messages.list);
  const sendMessage = useMutation(api.messages.send);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!viewer) {
      alert("Please sign in to send messages");
      return;
    }
    setNewMessageText("");
    sendMessage({ body: newMessageText, author: viewer }).catch((error) => {
      console.error("Failed to send message:", error);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b bg-white">
        <div className="flex gap-4 px-4">
          <button
            onClick={() => setActiveTab("loans")}
            className={`py-3 px-4 font-semibold transition-colors ${
              activeTab === "loans"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            AI Loan Processing
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 font-semibold transition-colors ${
              activeTab === "chat"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "loans" ? (
          <div className="p-6 space-y-6">
            <LoanRequestForm />
            {viewer ? (
              <LoanStatusDashboard userId={viewer} />
            ) : (
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <h2 className="text-xl font-bold mb-4">Your Loan Requests</h2>
                <p className="text-gray-500 mb-4">
                  Sign in to view your loan requests and track their progress through the AI agent workflow.
                </p>
                <Link href="/signin">
                  <Button>Sign In to View Loans</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <MessageList messages={messages}>
              {messages?.map((message) => (
                <Message
                  key={message._id}
                  authorName={message.author}
                  authorId={message.userId}
                  viewerId={viewer}
                >
                  {message.body}
                </Message>
              ))}
            </MessageList>
            <div className="border-t">
              <form onSubmit={handleSubmit} className="flex gap-2 p-4">
                <Input
                  value={newMessageText}
                  onChange={(event) => setNewMessageText(event.target.value)}
                  placeholder={viewer ? "Write a message…" : "Sign in to send messages…"}
                  disabled={!viewer}
                />
                <Button type="submit" disabled={newMessageText === "" || !viewer}>
                  Send
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
