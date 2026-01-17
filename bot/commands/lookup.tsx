import { type CommandInteraction, Container } from '@dressed/react'
import { type CommandConfig, CommandOption, getBan } from 'dressed'
import { unwrap } from '../../utilities'

export const config = {
  description: "Lookup a user's ban information (if available)",
  integration_type: 'Guild',
  guilds: [process.env.PRIMARY_GUILD_ID],
  default_member_permissions: ['BanMembers'],
  contexts: ['Guild'],
  options: [
    CommandOption({
      name: 'user',
      description: 'The user to lookup',
      type: 'User',
      required: true,
    }),
  ],
} satisfies CommandConfig

export default async function lookup(interaction: CommandInteraction<typeof config>) {
  await interaction.deferReply()

  const userId = interaction.getOption('user', true).user().id
  const [err, result] = await unwrap(getBan(process.env.PRIMARY_GUILD_ID, userId))

  console.log(err, result)

  // return await interaction.y(<Container>Lookup</Container>)
}
