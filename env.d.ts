declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_TOKEN: string
    DISCORD_APP_ID: string
    DISCORD_PUBLIC_KEY: string
    PRIMARY_GUILD_ID: string
    SECONDARY_GUILD_IDS: string
    TRACKER_ACTIVITY_ID: string
    CONVEX_HTTP_URL: string
  }
}
