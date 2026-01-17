import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getTrackerSessions = query({
  args: {
    guild_id: v.string(),
    user_id: v.string(),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query('tracker_sessions')
      .withIndex('by_guild_id_and_user_id', (q) => q.eq('guild_id', args.guild_id).eq('user_id', args.user_id))
      .collect()
  },
})

export const startTrackerSession = mutation({
  args: {
    guild_id: v.string(),
    user_id: v.string(),
    session_id: v.string(),
    start_epoch: v.number(),
  },
  async handler(ctx, args) {
    const exists = await ctx.db
      .query('tracker_sessions')
      .withIndex('by_session_id', (q) => q.eq('session_id', args.session_id))
      .first()

    if (exists) {
      console.log(
        `Session already exists for user. Guild: ${args.guild_id} User: ${args.user_id} Session: ${args.session_id}`,
      )

      return
    }

    await ctx.db.insert('tracker_sessions', {
      guild_id: args.guild_id,
      user_id: args.user_id,
      session_id: args.session_id,
      start_epoch: args.start_epoch,
    })
  },
})

export const endTrackerSession = mutation({
  args: {
    guild_id: v.string(),
    user_id: v.string(),
    session_id: v.string(),
    end_epoch: v.number(),
  },
  async handler(ctx, args) {
    const exists = await ctx.db
      .query('tracker_sessions')
      .withIndex('by_session_id', (q) => q.eq('session_id', args.session_id))
      .first()

    if (!exists) {
      console.log(
        `Session does not exist for user. Guild: ${args.guild_id} User: ${args.user_id} Session: ${args.session_id}`,
      )

      return
    }

    await ctx.db.patch('tracker_sessions', exists._id, {
      end_epoch: args.end_epoch,
    })
  },
})

export const getSessionAlert = query({
  args: {
    guild_id: v.string(),
    user_id: v.string(),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query('tracker_session_alerts')
      .withIndex('by_guild_id_and_user_id', (q) => q.eq('guild_id', args.guild_id).eq('user_id', args.user_id))
      .first()
  },
})

export const createSessionAlert = mutation({
  args: {
    guild_id: v.string(),
    user_id: v.string(),
    message_id: v.string(),
  },
  async handler(ctx, args) {
    const exists = await ctx.db
      .query('tracker_session_alerts')
      .withIndex('by_guild_id_and_user_id', (q) => q.eq('guild_id', args.guild_id).eq('user_id', args.user_id))
      .first()

    if (exists) {
      return
    }

    return await ctx.db.insert('tracker_session_alerts', {
      guild_id: args.guild_id,
      user_id: args.user_id,
      message_id: args.message_id,
    })
  },
})
