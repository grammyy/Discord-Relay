import { WebhookClient } from "discord.js"

// ↓ modules ↓
import { hooks, redirects, settings } from "../main.js"
import logging  from "./logging.js"
import util  from "./util.js"

// ↓ relay messages using webhooks ↓
var webhook = {
    relay:async function(webhook, message) {
        try {
            var content = message.content

            if (!content) {

                if (message.stickers.size > 0) {
                    message.stickers.keys().forEach((sticker) => { // todo: redo this more properly, this is a dirty way and only works if the user ONLY sends a sticker
                        content += ` https://media.discordapp.net/stickers/${sticker}.gif?size=160`
                    })
                } else {
                    return
                }
            }
            
            var client = new WebhookClient({ url: webhook })
      
            // ↓ configuration ↓
            var server = redirects[message.guildId] ? redirects[message.guildId].server : false
            var guild = (server || settings.server).replace("SERVER", message.guild.name)

            // ↓ author's data [nickname || globalname, avatar] ↓
            // if bot, add [BOT]; additionally, search settings for type of display
            var author = message.guild.members.cache.get(message.author.id)
            var display = (author.nickname || message.author.globalName) + (message.author.bot ? " [BOT]" : "")
            var isNicked = (display && (settings.name == "nickname"))

            // ↓ if nickname (if setting allows), set it or otherwise use username ↓
            var authorName = isNicked ? `${(display)}${guild}` : `${author.username}${guild}`
            var authorAvatarURL = author.displayAvatarURL({ format: 'png', size: 1024 })
      
            // ↓ check if the message is a reply ↓
            if (message.reference) {
                var repliedMessage = await message.channel.messages.fetch(message.reference.messageId)
    
                // todo: make it link back to the original
                // todo: make message link a optional setting
                // ↓ make reply a quote and formats into message link ↓
                var reply = `[${util.suppressEmbed(repliedMessage.content)}](https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId})`
                    .split('\n')
                    .map(line => '> ' + line)
                    .join('\n')
      
                content = reply + "\n" + content
            }

            return await client.send({
                username: authorName,
                avatarURL: authorAvatarURL,
                content: content,
                files: message.attachments.map(attachment => attachment.url)
            })
        } catch (error) {
            console.error(`Failed to send message via webhook:`, error)
        }
    },

    delete:function() {},

    edit:function() {},

    search:async function() {},

    init:function() {
        hooks.add("messageCreate", async function(message){
            // ↓ todo: add channel searching | check if the channel ID or name matches a source channel in redirects ↓
            var channel = redirects[message.channel.id]
            var channelCache = {}
        
            if (channel) {
                console.group(`Relaying message from ${message.guild.name} (${message.channel.name}): "${message.content}"`)
            
                var start = performance.now()
            
                for (var channels of Object.keys(channel.goto)) {
                    var channelId = channel.goto[channels]

                    try{    
                        var log = await webhook.relay(channelId, message)
            
                        console.log(`Routing as ${log.author.username} to: ${log.channel_id}`)
                        
                        channelCache[log.channel_id] = {
                            channelId: log.channel_id,
                        }
                    } catch(error) {
                        console.log(`Routing failed: ${error}/`)

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
                            name: `${channelCache[channelId]?.error ? "Error while " : ""}Relaying to:`,
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