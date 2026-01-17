import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  tracker_sessions: defineTable({
    guild_id: v.string(),
    user_id: v.string(),
    session_id: v.string(),
    activity_data: v.string(),
    start_epoch: v.optional(v.number()),
    end_epoch: v.optional(v.number()),
  })
    .index('by_guild_id_and_user_id', ['guild_id', 'user_id'])
    .index('by_session_id', ['session_id']),

  tracker_session_alerts: defineTable({
    guild_id: v.string(),
    user_id: v.string(),
    message_id: v.string(),
  }).index('by_guild_id_and_user_id', ['guild_id', 'user_id']),
})
