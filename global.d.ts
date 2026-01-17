// biome-ignore lint/complexity/noUselessEmptyExport: biome doesn't support this yet
export {}

import type {
  MessageComponentInteraction as OriginMessageComponentInteraction,
  ModalSubmitInteraction as OriginModalSubmitInteraction,
} from './node_modules/@dressed/react/dist'

declare module '@dressed/react' {
  type MessageComponentInteraction<T extends 'Button' | keyof ResolvedSelectValues | undefined = undefined> =
    OriginMessageComponentInteraction<T> & { updateResponse: OriginMessageComponentInteraction<T>['update'] }
  type ModalSubmitInteraction = OriginModalSubmitInteraction & {
    updateResponse: OriginModalSubmitInteraction<T>['update']
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_TOKEN: string
    DISCORD_APP_ID: string
    DISCORD_PUBLIC_KEY: string
    PRIMARY_GUILD_ID: string
    SECONDARY_GUILD_IDS: string
  }
}
