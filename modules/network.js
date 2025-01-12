// ↓ modules ↓
import { hooks, redirects } from "../main.js"
import logging from "./logging.js"
import webhook from "./webhook.js"

var network = {
    populate: function() {},
    
    init:function() {
        hooks.add("messageCreate", async function(message){
            var source = redirects[message.channelId]
            var netcode = source?.network

            if (!netcode) return

            console.group(`Relaying message from ${message.guild.name} (${message.channel.name}): "${message.content}"`)

            var start = performance.now()
            var channelCache = {}

            // ↓ main relay code here, sends to all chanel tunnels with a matching network code ↓
            for (var channelId in redirects) {
                var channel = redirects[channelId]
                var code = channel.network

                if (netcode == code && !(channelId == message.channel.id)) {
                    try {
                        var log = await webhook.relay(channel.webhook, message)

                        console.log(`Relayed: "${message.content}" as ${log.author.username} to: ${log.channel_id}`)

                        channelCache[log.channel_id] = {
                            channelId: log.channel_id,
                            ms: log.ms
                        }
                    } catch (error) {
                        console.error(`Relay failed for chanel ${channelId}: ${error}`.red)

                        channelCache[channelId] = {
                            channelId: channelId, 
                            error: error
                        }
                    }
                }
            }

            var end = performance.now()
            var duration = (end - start).toFixed(2)

            if (source?.logs) {
                logging.log(source.logs, {
                    title: `messageCreate log from: ${message.author.username}`,
                    description: `Relaying message from ${message.guild.name} (${message.channel.name}): ["${message.content}"](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`,
                    color: 0x00ff00,
                    fields: Object.keys(channelCache).map(channelId => ({
                        name: `${channelCache[channelId]?.error ? "Error while " : ""}Relaying to: ${channelCache[channelId].channelId}`,
                        value: channelCache[channelId]?.error || `Done in ${channelCache[channelId].ms}ms`,
                        inline: true
                    })),
                    footer: {
                        text: `Completed in ${duration}ms`
                    },
                })
            }
            
            console.groupEnd()
        })

        return `[ ${"OK".green} ] "Network" module loaded successfully.`
    }
}

export default network
