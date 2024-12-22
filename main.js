import { Client, GatewayIntentBits } from "discord.js"
import color from "colors"
import fs from "fs"
import env from "dotenv"

// ↓ modules ↓
import twoway from "./modules/twoway.js"
import util from "./modules/util.js"
import webhook from "./modules/webhook.js"

env.config()

// ↓ configuration ↓
var token = process.env.token

export var config = JSON.parse(fs.readFileSync('config.json', 'utf8'))
export var settings = config.global
export var redirects = config.redirects

// ↓ hooks ↓
export var hooks = {
    messageCreate: [],

    add:function(event, func) {
        hooks[event].push(func)
    }
}

var client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

client.once('ready', () => {
    console.log(twoway.init())
    console.log(util.init())
    console.log(webhook.init())
    // ↑ module inits ↑

    console.log(`Logged in as: ${client.user.tag}\n\n↓ Logging below ↓`)
})

client.on('messageCreate', async message => {
    if (message.webhookId) return

    // ↓ todo: add channel searching | check if the channel ID or name matches a source channel in redirects ↓
    var hookedChannel = redirects[message.channel.id]

    if (hookedChannel) {
        console.log(`Relaying message from ${message.guild.name} (${message.channel.name}): "${message.content}"`)

        for (var channel of Object.keys(redirects[message.channel.id].goto)) {
            var log = await webhook.relay(redirects[message.channel.id].goto[channel], message)

            console.log(`   -> Routing as ${log.author.username} to: ${log.channel_id}`)
        }
    }

    for (var hook of hooks.messageCreate) {
        hook(message)
    }
})

client.login(token)