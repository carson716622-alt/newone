import { relations } from "drizzle-orm";
import { appUsers, couples, hearts, messages } from "./schema";

export const appUsersRelations = relations(appUsers, ({ one }) => ({
  couple: one(couples, {
    fields: [appUsers.coupleId],
    references: [couples.id],
  }),
}));

export const couplesRelations = relations(couples, ({ one, many }) => ({
  user1: one(appUsers, {
    fields: [couples.user1Id],
    references: [appUsers.id],
    relationName: "coupleUser1",
  }),
  user2: one(appUsers, {
    fields: [couples.user2Id],
    references: [appUsers.id],
    relationName: "coupleUser2",
  }),
  hearts: many(hearts),
  messages: many(messages),
}));

export const heartsRelations = relations(hearts, ({ one }) => ({
  sender: one(appUsers, {
    fields: [hearts.senderId],
    references: [appUsers.id],
    relationName: "heartSender",
  }),
  receiver: one(appUsers, {
    fields: [hearts.receiverId],
    references: [appUsers.id],
    relationName: "heartReceiver",
  }),
  couple: one(couples, {
    fields: [hearts.coupleId],
    references: [couples.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(appUsers, {
    fields: [messages.senderId],
    references: [appUsers.id],
    relationName: "messageSender",
  }),
  receiver: one(appUsers, {
    fields: [messages.receiverId],
    references: [appUsers.id],
    relationName: "messageReceiver",
  }),
  couple: one(couples, {
    fields: [messages.coupleId],
    references: [couples.id],
  }),
}));
