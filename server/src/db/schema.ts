import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const cardPriorityEnum = pgEnum('card_priority', ['low', 'medium', 'high']);
export const columnNameEnum = pgEnum('column_name', ['todo', 'in_progress', 'done']);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     varchar('email', { length: 255 }).notNull().unique(),
  password:  varchar('password', { length: 255 }).notNull(),
  name:      varchar('name', { length: 100 }).notNull(),
  role:      userRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Boards ───────────────────────────────────────────────────────────────────

export const boards = pgTable('boards', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  ownerId:     uuid('owner_id').notNull().references(() => users.id),
  inviteCode:  uuid('invite_code').notNull().defaultRandom().unique(),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
  deletedAt:   timestamp('deleted_at'),
});

// ─── Board Members ────────────────────────────────────────────────────────────

export const boardMembers = pgTable('board_members', {
  id:       uuid('id').primaryKey().defaultRandom(),
  boardId:  uuid('board_id').notNull().references(() => boards.id),
  userId:   uuid('user_id').notNull().references(() => users.id),
  role:     userRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

// ─── Cards ────────────────────────────────────────────────────────────────────

export const cards = pgTable('cards', {
  id:          uuid('id').primaryKey().defaultRandom(),
  boardId:     uuid('board_id').notNull().references(() => boards.id),
  columnName:  columnNameEnum('column_name').notNull().default('todo'),
  title:       varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  assigneeId:  uuid('assignee_id').references(() => users.id),
  priority:    cardPriorityEnum('priority').notNull().default('medium'),
  dueDate:     timestamp('due_date'),
  position:    varchar('position', { length: 50 }).notNull().default('0'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
  deletedAt:   timestamp('deleted_at'),
});

// ─── Card Comments ────────────────────────────────────────────────────────────

export const cardComments = pgTable('card_comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    uuid('card_id').notNull().references(() => cards.id),
  userId:    uuid('user_id').notNull().references(() => users.id),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ─── Card Activity Log ────────────────────────────────────────────────────────

export const cardActivity = pgTable('card_activity', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    uuid('card_id').notNull().references(() => cards.id),
  userId:    uuid('user_id').notNull().references(() => users.id),
  action:    varchar('action', { length: 100 }).notNull(),
  metadata:  text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type User         = typeof users.$inferSelect;
export type NewUser      = typeof users.$inferInsert;
export type Board        = typeof boards.$inferSelect;
export type NewBoard     = typeof boards.$inferInsert;
export type BoardMember  = typeof boardMembers.$inferSelect;
export type Card         = typeof cards.$inferSelect;
export type NewCard      = typeof cards.$inferInsert;
export type CardComment  = typeof cardComments.$inferSelect;
export type CardActivity = typeof cardActivity.$inferSelect;