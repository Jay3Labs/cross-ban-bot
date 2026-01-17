import { createConnection } from '@dressed/ws'
import { createInteraction, handleInteraction } from 'dressed/server'
import { commands, components, config } from './.dressed'

const connection = createConnection({
  intents: ['GuildModeration', 'GuildMembers', 'Guilds'],
})

connection.onReady((data) => console.log(data.user.username, 'is ready'), {
  once: true,
})

connection.onInteractionCreate((data) => {
  const interaction = createInteraction(data)
  handleInteraction(commands, components, interaction, config.middleware)
})
