import { type CommandInteraction, Container } from '@dressed/react'
import { user } from 'discord-fmt'
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

  if (err) {
    if (err.cause && (err.cause as { status: number }).status === 404) {
      return await interaction.editReply(<Container>{user(userId)} is not currently banned</Container>)
    } else {
      console.error(err)
      return await interaction.editReply(<Container>Error looking up ban information</Container>)
    }
  }

  return await interaction.editReply(
    <Container>
      {user(userId)} (`{result.user.username}`) is currently banned
      {'\n'}
      ### Reason
      {'\n'}
      {result.reason ?? 'No reason provided'}
    </Container>,
  )
}
