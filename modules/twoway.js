// ↓ modules ↓
import { hooks, redirects, settings } from "../main.js"
import logging  from "./logging.js"
import webhook from "./webhook.js"

var twoway = {
    init:function(){
        hooks.add("messageCreate", async function(message) {
            var twoway = redirects[message.guildId] && redirects[message.guildId]["two-way"] !== undefined
                ? redirects[message.guildId]["two-way"]
                : settings["two-way"]
            
            if (twoway) {
                // todo: make it send to all other redirects as well, not just the parent
                console.group(`Relaying message from ${message.guild.name} (${message.channel.name}): "${message.content}"`)

                var channelCache = {}

                for (var channels in redirects) {
                    var channel = redirects[channels]
                    var goto = channel.goto || {}
        
                    if (goto[message.channel.id]) {
                        var start = performance.now()

                        try {    
                            var log = await webhook.relay(channel.webhook, message)

                            console.log(`Reverse routing: "${message.content}" as ${log.author.username} to ${log.channel_id}`)
                            
                            channelCache[message.channelId] = {
                                channelId: log.channel_id,
                            }
                        } catch(error) {
                            console.log(`Reverse routing failed: ${error}/`)

                            channelCache[message.channelId] = {
                                channelId: message.channelId,
                                error: error
                            }
                        }

                        var end = performance.now()
                        var duration = (end - start).toFixed(2)

                        if (channel.logs) {
                            logging.log(channel.logs, {
                                title: `messageCreate log from: ${message.author.username}`,
                                description: `Relaying message from ${message.guild.name} (${message.channel.name}): ["${message.content}"](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`,
                                color: 0x00ff00,
                                // todo: add all other redirects and parent to log
                                fields: Object.keys(goto).map(channelId => ({
                                    name: `${channelCache[channelId]?.error ? "Error while " : ""}Reverse-relaying to:`,
                                    value: channelCache[channelId].channelId + (channelCache[channelId]?.error ? ` -> "${channelCache[channelId]?.error}"` : ""),
                                    inline: true
                                })),
                                footer: {
                                    text: `Completed in ${duration}ms`
                                },
                                
                                // todo: change this out for actual settings/fallback
                                username: "test relay",
                                avatarUrl: "https://cdn.discordapp.com/avatars/1308288522574233661/e22cc7964fce3430dcc142f60ddd84b3.webp?size=1024&width=506&height=506"
                            })
                        }
                    }
                }

                console.groupEnd()
            }
        })

        return `[ ${"OK".green} ] "Two-way" module loaded successfully.`
    }
}

export default twoway