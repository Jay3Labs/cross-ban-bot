import { installCommands } from 'dressed/server'
import { commands } from './.dressed'

installCommands(commands)
  .catch(console.error)
  .finally(() => {
    console.log('Commands registered successfully')
    process.exit(0)
  })
