import { createConnection } from '@dressed/ws'
import { createInteraction, handleInteraction } from 'dressed/server'
import { commands, components, config } from './.dressed'
import { SECONDARY_GUILD_IDS } from './env'

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

  const activities = data.activities?.filter(
    (activity) => activity.name.toLowerCase().includes('tracker') || activity.name.toLowerCase().includes('rivals'),
  )

  if (activities) {
    console.log(JSON.stringify(activities))
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
