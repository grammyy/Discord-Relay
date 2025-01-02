import { WebhookClient, EmbedBuilder } from "discord.js"
import color from "colors"

// ↓ modules ↓
import { settings } from "../main.js"

var logging = {
    // ↓ log to channel (optional) & log to console ↓
    log:function(webhook, event) {
        var client = new WebhookClient({ url: webhook })

        var embed = new EmbedBuilder()
            .setTitle(event.title)
            .setDescription(event.description)
            .setColor(event.color)
            .setTimestamp()
            .addFields(event.fields)
            .setFooter(event.footer)

        var payload = {
            username: event.username || settings.username,
            avatarURL: event.avatarUrl || settings.avatarUrl,
            embeds: [embed],
        }

        client.send(payload).catch(error => {
            console.error(`Relay message log failed: "${error}".`.red)
        })
    },

    init:function(){
        return `[ ${"OK".green} ] "Logging" module loaded successfully.`
    }
}

export default logging