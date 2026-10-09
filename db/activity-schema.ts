import {sqliteTable,text,integer,real,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const readingDaily=sqliteTable('reading_daily',{
 userId:text('user_id').notNull(),workId:text('work_id').notNull(),day:text('day').notNull(),format:text('format').notNull(),gain:real('gain').notNull().default(0),updatedAt:integer('updated_at').notNull(),
},t=>[primaryKey({columns:[t.userId,t.workId,t.day,t.format]})]);
export const visits=sqliteTable('platform_visits',{
 id:text('id').primaryKey(),actor:text('actor').notNull(),startedAt:integer('started_at').notNull(),lastSeen:integer('last_seen').notNull(),lastView:text('last_view').notNull(),views:integer('views').notNull().default(1),workId:text('work_id'),format:text('format'),
},t=>[index('visits_seen').on(t.lastSeen),index('visits_started').on(t.startedAt)]);
