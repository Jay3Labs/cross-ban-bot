import { createConnection } from '@dressed/ws'
import { ConvexClient } from 'convex/browser'
import { type APIMessageTopLevelComponent, MessageFlags } from 'discord-api-types/v10'
import { list, user } from 'discord-fmt'
import { Container, editWebhookMessage, executeWebhook, TextDisplay } from 'dressed'
import { createInteraction, handleInteraction } from 'dressed/server'
import { commands, components, config } from './.dressed'
import { api } from './convex/_generated/api'
import { SECONDARY_GUILD_IDS, TRACKER_ACTIVITY_ID, WEBHOOK_ID, WEBHOOK_TOKEN } from './env'
import { unwrap } from './utilities'

const convexClient = new ConvexClient(process.env.CONVEX_URL || '')

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

connection.onPresenceUpdate(async (data) => {
  if (!SECONDARY_GUILD_IDS.includes(data.guild_id)) {
    return
  }

  const trackerActivity = data.activities?.find((activity) => activity.application_id === TRACKER_ACTIVITY_ID)
  const backupActivities = data.activities?.filter((activity) => activity.name.toLowerCase().includes('tracker')) || []

  if (backupActivities.length > 0) {
    console.log(JSON.stringify(data))
  }

  if (!trackerActivity) {
    return
  }

  if (!trackerActivity.session_id || !trackerActivity.timestamps) {
    console.log('No session_id or timestamps found for tracker activity')
    return
  }

  const { session_id, timestamps } = trackerActivity

  if (!timestamps.start && !timestamps.end) {
    console.log('No timestamps found for tracker activity')
    return
  }

  const guildId = data.guild_id
  const userId = data.user.id
  const username = data.user.username

  console.log(`Updating tracker session for ${username} (${userId}) in guild ${guildId}`)

  try {
    if (timestamps.start) {
      await convexClient.mutation(api.tracker.startTrackerSession, {
        guild_id: guildId,
        user_id: userId,
        session_id,
        start_epoch: timestamps.start,
      })
      console.log('Tracker session started for', username)
    } else if (timestamps.end) {
      await convexClient.mutation(api.tracker.endTrackerSession, {
        guild_id: guildId,
        user_id: userId,
        session_id,
        end_epoch: timestamps.end,
      })
      console.log('Tracker session ended for', username)
    } else {
      console.log('No timestamps found for tracker activity')
    }

    await createSessionAlert({ guild_id: guildId, user_id: userId })
  } catch (err) {
    console.error('Error when handling tracker session:', err)
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

export async function createSessionAlert({ guild_id, user_id }: { guild_id: string; user_id: string }) {
  const existing = await convexClient.query(api.tracker.getSessionAlert, {
    guild_id,
    user_id,
  })

  const totalSessions = await convexClient.query(api.tracker.getTrackerSessions, {
    guild_id,
    user_id,
  })

  const components: APIMessageTopLevelComponent[] = [
    Container(TextDisplay(`## ${user(user_id)} Tracker Usage\n${list(`Total Sessions: ${totalSessions.length}`)}`)),
  ]

  console.log(JSON.stringify(components))

  if (!existing) {
    const [err, result] = await unwrap(
      executeWebhook(
        WEBHOOK_ID,
        WEBHOOK_TOKEN,
        {
          username: 'Tracker Alerts',
          avatar_url: 'https://sm.ign.com/t/ign_pk/cover/a/avatar-gen/avatar-generations_rpge.600.jpg',
          components,
          flags: MessageFlags.IsComponentsV2,
        },
        {
          wait: true,
          with_components: true,
        },
      ),
    )

    if (err) {
      console.error('Error executing webhook:', err)
      return
    }

    await convexClient.mutation(api.tracker.createSessionAlert, {
      guild_id,
      user_id,
      message_id: result.id,
    })
  } else {
    const [err] = await unwrap(
      editWebhookMessage(
        WEBHOOK_ID,
        WEBHOOK_TOKEN,
        existing.message_id,
        {
          components,
          flags: MessageFlags.IsComponentsV2,
        },
        {
          with_components: true,
        },
      ),
    )

    if (err) {
      console.error('Error editing webhook message:', err)
      return
    }
  }
}
