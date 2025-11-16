/**
 * Agent Communication Service for Convex
 *
 * Handles inter-agent messaging using Convex database.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Send a message from one agent to another
 */
export const sendMessage = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    type: v.string(),
    subject: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await ctx.db.insert("agentMessages", {
      messageId,
      from: args.from,
      to: args.to,
      type: args.type,
      subject: args.subject,
      payload: args.payload,
      read: false,
      timestamp: Date.now(),
    });

    console.log(`[Communication] Message sent: ${messageId} from ${args.from} to ${args.to}`);

    return {
      success: true,
      messageId,
      timestamp: Date.now(),
    };
  },
});

/**
 * Get unread messages for an agent
 */
export const getUnreadMessages = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("agentMessages")
      .withIndex("by_recipient", (q) => q.eq("to", args.agentId).eq("read", false))
      .collect();

    return messages;
  },
});

/**
 * Mark messages as read
 */
export const markAsRead = mutation({
  args: {
    messageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    for (const messageId of args.messageIds) {
      const message = await ctx.db
        .query("agentMessages")
        .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
        .first();

      if (message) {
        await ctx.db.patch(message._id, { read: true });
      }
    }

    return { success: true, count: args.messageIds.length };
  },
});

/**
 * Mark all messages for an agent as read
 */
export const markAllAsRead = mutation({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("agentMessages")
      .withIndex("by_recipient", (q) => q.eq("to", args.agentId).eq("read", false))
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, { read: true });
    }

    return { success: true, count: messages.length };
  },
});

/**
 * Get all messages for an agent (read and unread)
 */
export const getAllMessages = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("agentMessages")
      .filter((q) => q.eq(q.field("to"), args.agentId))
      .order("desc")
      .take(args.limit || 50);

    return messages;
  },
});
