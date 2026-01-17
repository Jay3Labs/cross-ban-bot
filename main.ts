import { createConnection } from '@dressed/ws'
import { ConvexHttpClient } from 'convex/browser'
import { createInteraction, handleInteraction } from 'dressed/server'
import { commands, components, config } from './.dressed'
import { api } from './convex/_generated/api.js'
import { SECONDARY_GUILD_IDS, TRACKER_ACTIVITY_ID } from './env'

const convexClient = new ConvexHttpClient(process.env.CONVEX_HTTP_URL || '')

const connection = createConnection({
  intents: ['GuildModeration', 'GuildMembers', 'Guilds', 'GuildPresences'],
})

connection.onReady((data) => console.log(data.user.username, 'is ready'), {
  once: true,
})

connection.onInteractionCreate((data) => {
  const interaction = createInteraction(data)
  handleInteraction(commands, components, interaction, config.middleware)
})

connection.onPresenceUpdate((data) => {
  if (!SECONDARY_GUILD_IDS.includes(data.guild_id)) {
    return
  }

  const trackerActivity = data.activities?.find((activity) => activity.id === TRACKER_ACTIVITY_ID)

  if (!trackerActivity || !trackerActivity.session_id || !trackerActivity.timestamps) {
    return
  }

  const { session_id, timestamps } = trackerActivity

  if (!timestamps.start && !timestamps.end) {
    return
  }

  if (timestamps.start) {
    convexClient
      .mutation(api.tracker.startTrackerSession, {
        guild_id: data.guild_id,
        user_id: data.user.id,
        session_id,
        start_epoch: timestamps.start,
      })
      .then(() => {
        console.log('Tracker session started for', data.user.username)
      })
  } else if (timestamps.end) {
    convexClient
      .mutation(api.tracker.endTrackerSession, {
        guild_id: data.guild_id,
        user_id: data.user.id,
        session_id,
        end_epoch: timestamps.end,
      })
      .then(() => {
        console.log('Tracker session ended for', data.user.username)
      })
  }
})

process.on('uncaughtException', (err) => {
  console.error(err)
})

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error) {
    console.error({ err: reason })
  } else {
    console.error(String(reason))
  }
})
