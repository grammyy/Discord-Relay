import { WebhookClient } from "discord.js"

// ↓ modules ↓
import { redirects, settings } from "../main.js"
import util  from "./util.js"

// ↓ relay messages using webhooks ↓
var webhook = {
    relay:async function(webhook, message){
        try {
            var webhookClient = new WebhookClient({ url: webhook })
      
            // ↓ configuration ↓
            var guild = (redirects[message.guildId].server || settings.server).replace("SERVER", message.guild.name)

            // ↓ author's data [nickname || globalname, avatar] ↓
            var author = message.guild.members.cache.get(message.author.id)
            var display = author.nickname || message.author.globalName
            var isNicked = ((display) && (settings.name == "nickname"))

            var authorName = isNicked ? `${(display)}${guild}` : `${author.username}${guild}`
            var authorAvatarURL = author.displayAvatarURL({ format: 'png', size: 1024 })
      
            // ↓ check if the message is a reply ↓
            if (message.reference) {
                var repliedMessage = await message.channel.messages.fetch(message.reference.messageId)
      
                message.content = `> ${util.suppressEmbed(repliedMessage.content)}\n` + message.content
            }
      
            return await webhookClient.send({
                username: authorName,
                avatarURL: authorAvatarURL,
                content: message.content
            })
        } catch (error) {
            console.error(`Failed to send message via webhook:`, error)
        }
    },

    init:function(){
        return `[ ${"OK".green} ] "Webhook" module loaded successfully.`
    }
}

export default webhook