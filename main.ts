import { createConnection } from '@dressed/ws'
import { ConvexHttpClient } from 'convex/browser'
import { type APIMessageTopLevelComponent, MessageFlags } from 'discord-api-types/v10'
import { list, user } from 'discord-fmt'
import { Container, editWebhookMessage, executeWebhook, TextDisplay } from 'dressed'
import { createInteraction, handleInteraction } from 'dressed/server'
import { commands, components, config } from './.dressed'
import { api } from './convex/_generated/api'
import { SECONDARY_GUILD_IDS, TRACKER_ACTIVITY_ID, WEBHOOK_ID, WEBHOOK_TOKEN } from './env'
import { unwrap } from './utilities'

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
        return createSessionAlert({ guild_id: data.guild_id, user_id: data.user.id })
      })
      .catch((err) => {
        console.error('Error when handling start:', err)
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
        return createSessionAlert({ guild_id: data.guild_id, user_id: data.user.id })
      })
      .catch((err) => {
        console.error('Error when handling end:', err)
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
