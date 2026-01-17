import { type MessageComponentInteraction, patchInteraction } from '@dressed/react'
import type { ServerConfig } from 'dressed/server'

export default {
  build: { extensions: ['tsx', 'ts'], root: './bot' },
  port: 3000,
  middleware: {
    commands: (i) => [patchInteraction(i)],
    async components(i, ...p) {
      const patched = patchInteraction(i)

      return [
        {
          ...patched,
          updateResponse(...p) {
            if (patched.history.some((h) => ['reply', 'deferReply', 'update', 'deferUpdate'].includes(h))) {
              return this.editReply(...p)
            }
            return this.update(...p)
          },
        } as MessageComponentInteraction,
        ...p,
      ]
    },
  },
} satisfies ServerConfig
