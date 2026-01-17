import { createConnection } from '@dressed/ws'
import { createInteraction, handleInteraction } from 'dressed/server'
import { commands, components, config } from './.dressed'
import { SECONDARY_GUILD_IDS, TRACKER_ACTIVITY_ID } from './env'

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

  if (!trackerActivity) {
    return
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
