// ↓ modules ↓
import { hooks, redirects, settings } from "../main.js"
import webhook from "./webhook.js"

var twoway = {
    init:function(){
        hooks.add("messageCreate", async function(message){
            var twoway = redirects[message.guildId] && redirects[message.guildId]["two-way"] !== undefined
                ? redirects[message.guildId]["two-way"]
                : settings["two-way"]
          
            if (twoway) {
                for (var channel in redirects) {
                    var goto = redirects[channel].goto || {}
        
                    if (goto[message.channel.id]) {
                        var log = await webhook.relay(redirects[channel].webhook, message)
                        
                        console.log(`   -> Reverse routing: "${message.content}" as ${log.author.username} to ${log.channel_id}`)
                    }
                }
            }
        })

        return `[ ${"OK".green} ] "Two-way" module loaded successfully.`
    }
}

export default twoway