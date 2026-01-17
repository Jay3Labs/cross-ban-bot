import { createConnection } from '@dressed/ws'

const connection = createConnection({
  intents: ['GuildModeration', 'GuildMembers', 'Guilds'],
})
connection.onReady((data) => console.log(data.user.username, 'is ready'), {
  once: true,
})
