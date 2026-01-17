import { patchInteraction } from '@dressed/react'
import type { ServerConfig } from 'dressed/server'

export default {
  build: { extensions: ['tsx', 'ts'], root: './bot' },
  port: 3000,
  middleware: {
    commands: (i) => [patchInteraction(i)],
    components: (i) => [patchInteraction(i)],
  },
} satisfies ServerConfig
