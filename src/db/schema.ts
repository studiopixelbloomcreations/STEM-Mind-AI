import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  real,
} from "drizzle-orm/pg-core";

/**
 * NexLearn data model — teacher-provisioned students, quiz sessions and
 * per-question attempts. Attempts are the raw evidence every analytics
 * surface (hub, dashboard, difficulty calibrator agent) reads from.
 */
export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  hue: integer("hue").notNull().default(150),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  grade: integer("grade").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  asked: integer("asked").notNull().default(0),
  correct: integer("correct").notNull().default(0),
  stuck: integer("stuck").notNull().default(0),
  peakDifficulty: integer("peak_difficulty").notNull().default(1),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  kind: text("kind").notNull(),
  correct: boolean("correct").notNull(),
  stuck: boolean("stuck").notNull().default(false),
  difficulty: integer("difficulty").notNull(),
  score: real("score").notNull().default(0),
  timeMs: integer("time_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
