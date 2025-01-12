import { WebhookClient } from "discord.js"

// ↓ modules ↓
import { hooks, redirects, settings } from "../main.js"
import logging  from "./logging.js"
import util  from "./util.js"

// ↓ relay messages using webhooks ↓
var webhook = {
    relay:async function(webhook, message) {
        try {
            var start = performance.now()
            var client = new WebhookClient({ url: webhook })
            var content = message.content

            // todo: transfer to utils
            if (!content && message.stickers.size > 0) {
                message.stickers.forEach(sticker => {
                    content += ` https://media.discordapp.net/stickers/${sticker}.gif?size=160`
                })
            }
            
            // ↓ check if the message is a reply ↓
            if (message.reference) {
                var repliedMessage = await message.channel.messages.fetch(message.reference.messageId)
    
                // todo: make message link a optional setting
                // ↓ make reply a quote and formats into message link ↓
                var reply = `[${util.suppressEmbed(repliedMessage.content)}](https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId})`
                    .split('\n')
                    .map(line => '> ' + line)
                    .join('\n')
      
                content = reply + "\n" + content
            }

            var [name, avatar] = util.getDisplayName(message.author, message.guild)

            var log = await client.send({
                username: name,
                avatarURL: avatar,
                content: content,
                files: message.attachments.map(attachment => attachment.url)
            })

            var end = performance.now()
            var duration = (end - start).toFixed(2)
            log.ms = duration

            return log
        } catch (error) {
            console.error(`Relay failed for channel ${message.channel.name} in ${message.guild.name}: ${error}`.red)
        }
    },

    delete:function() {},

    edit:function() {},

    search:async function() {},

    init:function() {
        hooks.add("messageCreate", async function(message){
            // ↓ todo: add channel searching | check if the channel ID or name matches a source channel in redirects ↓
            var channel = redirects[message.channel.id]
            var goto = channel?.goto
            var channelCache = {}

            if (channel && goto) {
                console.group(`Relaying message from ${message.guild.name} (${message.channel.name}): "${message.content}"`)
            
                var start = performance.now()
            
                for (var channels of Object.keys(goto || {})) {
                    var channelId = goto[channels]

                    try{
                        var log = await webhook.relay(channelId, message)
            
                        console.log(`Routing as ${log.author.username} to: ${log.channel_id}`)
                        
                        channelCache[log.channel_id] = {
                            channelId: log.channel_id,
                            ms: log.ms
                        }
                    } catch(error) {
                        console.log(`Routing failed at ${channelId}: ${error}/`)

                        channelCache[channelId] = {
                            channelId: channelId, 
                            error: error
                        }
                    }
                }
            
                var end = performance.now()
                var duration = (end - start).toFixed(2)
            
                if (channel.logs) {
                    logging.log(channel.logs, {
                        title: `messageCreate log from: ${message.author.username}`,
                        description: `Relaying message from ${message.guild.name} (${message.channel.name}): ["${message.content}"](https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id})`,
                        color: 0x00ff00,
                        fields: Object.keys(channel.goto).map(channelId => ({
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
            }
        })

        // hooks.add("messageDelete", async function(message){
        //     console.log(`Message deleted in ${message.guild?.name || "Unknown Guild"} (${message.channel.name}): "${message.content}"`)

        //     var channel = redirects[message.channel.id]

        //     if (channel) {
        //         for (var channel of Object.keys(channel.goto)) {
        //             console.log(await webhook.search(channel, message))
        //         }
        //     }
        // })

        return `[ ${"OK".green} ] "Webhook" module loaded successfully.`
    }
}

export default webhook
