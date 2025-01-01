// ↓ modules ↓
import { hooks, redirects, settings } from "../main.js"
import logging from "./logging.js"
import webhook from "./webhook.js"

var twoway = {
    init: function () {
        hooks.add("messageCreate", async function (message) {
            for (var channelId in redirects) {
                var channel = redirects[channelId]
                var goto = channel.goto || {}

                var twoway = channel?.["two-way"] === undefined
                    ? settings["two-way"]
                    : channel["two-way"]

                if (!twoway) return

                var channels = {}

                // ↓ append all other redirections and parent hook ↓
                if (goto[message.channel.id]) {
                    channels[channelId] = channel.webhook

                    for (var channelId in goto) {
                        if (channelId !== message.channel.id) {
                            channels[channelId] = goto[channelId]
                        }
                    }
                }
            }

            if (Object.keys(channels).length === 0) return

            console.group(`Relaying message from ${message.guild.name} (${message.channel.name}): "${message.content}"`)

            var channelCache = {}
            var start = performance.now()

            // ↓ main relay code here, sends to parent and all others ↓
            for (var channelId in channels) {
                try {
                    var log = await webhook.relay(channels[channelId], message)

                    console.log(`Relayed: "${message.content}" as ${log.author.username} to ${log.channel_id}`)
                    
                    channelCache[channelId] = { 
                        channelId: log.channel_id 
                    }
                } catch (error) {
                    console.error(`Relay failed for channel ${channelId}: ${error}`)

                    channelCache[channelId] = { 
                        channelId,
                        error: [
                            error, 
                            error.message
                        ] 
                    }
                }
            }

            var end = performance.now()
            var duration = (end - start).toFixed(2)

            if (channel.logs) {
                logging.log(channel.logs, {
                    title: `Message relay log from: ${message.author.username}`,
                    description: `Relaying message from ${message.guild.name} (${message.channel.name}): ["${message.content}"](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`,
                    color: 0x00ff00,
                    fields: Object.keys(channels).map(channelId => ({
                        name: `${channelCache[channelId]?.error ? "Error while " : ""}Relayed to:`,
                        value: channelCache[channelId]?.channelId + (channelCache[channelId]?.error ? ` -> "${channelCache[channelId]?.error}"` : ""),
                        inline: true,
                    })),
                    footer: { text: `Completed in ${duration}ms` },
                    
                    // todo: change this out for actual settings/fallback
                    username: "Message Relay Bot",
                    avatarUrl: "https://cdn.discordapp.com/avatars/1308288522574233661/e22cc7964fce3430dcc142f60ddd84b3.webp?size=1024",
                })
            }

            console.groupEnd()
        })

        return `[ ${"OK".green} ] "Two-way" module loaded successfully.`
    },
}

export default twoway