import { Client, GatewayIntentBits } from "discord.js"
import { watch } from "chokidar"
import color from "colors"
import fs from "fs"
import env from "dotenv"

// ↓ modules ↓
import twoway from "./modules/twoway.js"
import logging from "./modules/logging.js"
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
    messageDelete: [],

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

// ↓ bot logic and behavior ↓

client.once('ready', () => {
    console.log(logging.init())
    console.log(twoway.init())
    console.log(util.init())
    console.log(webhook.init())
    // ↑ module inits ↑

    console.log(`Logged in as: ${client.user.tag}\n\n↓ Logging below ↓`)
})

client.on('messageCreate', async message => {
    if (message.webhookId) return

    for (var hook of hooks.messageCreate) {
        hook(message)
    }
})

client.on('messageDelete', async message => {
    if (message.partial) {
        try {
            await message.fetch()
        } catch (error) {
            console.log(`Failed to fetch deleted message: ${error}`.red)
            
            return
        }
    }

    for (var hook of hooks.messageDelete) {
        hook(message)
    }
})

client.login(token)

// ↓ non-important setup; post-init ↓

var watcher = watch("config.json", {
    persistent: true
})

watcher.on("change", () => {
    console.group('Config file updated, reloading...')

    try{
        config = JSON.parse(fs.readFileSync("config.json", "utf8"))

        // todo: perform verification checks to check if relaying is possible with provided settings
        for (var channel in config.redirects) {
            if (!redirects[channel]) {
                console.group(`New relay found: ${channel}. Listing relay tunnels now...`)
                
                for (var channel in config.redirects[channel].goto) {
                    console.log(`-> ${channel}`)
                }

                console.groupEnd()
            }
        }

        settings = config.global
        redirects = config.redirects

        console.log("Updated config successfully.".green)
    } catch(error) {
        console.log("Updating config internally has failed. Please check syntax.".red)
    }

    console.groupEnd()
})