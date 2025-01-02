// ↓ modules ↓
import { redirects, settings } from "../main.js"

var util = {
    getDisplayName:function(member, guild) {
        // todo: change variable names, they suck
        // ↓ configuration ↓
        var server = redirects[guild.id] ? redirects[guild.id].server : false
        var tag = (server || settings.server).replace("SERVER", guild.name)
        
        // ↓ member's data [nickname || globalname, avatar] ↓
        // if bot, add [BOT]; additionally, search settings for type of display; make optional later
        var author = guild.members.cache.get(member.id)
        var display = (author.nickname || member.globalName) + (member.bot ? " [BOT]" : "")
        var isNicked = (display && (settings.name == "nickname"))

        // ↓ if nickname (if setting allows), set it or otherwise use username ↓
        var authorName = isNicked ? `${(display)}${tag}` : `${author.username}${tag}`
        var authorAvatarURL = author.displayAvatarURL({ format: 'png', size: 1024 })

        return [authorName, authorAvatarURL]
    },

    suppressEmbed:function(content) {
        var urlRegex = /(https?:\/\/[^\s]+)/g
    
        return content.replace(urlRegex, (url) => `<${url}>`)
    },

    init:function() {
        return `[ ${"OK".green} ] "Util" module loaded successfully.`
    }
}

export default util