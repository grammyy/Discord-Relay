var util = {
    suppressEmbed:function(content) {
        var urlRegex = /(https?:\/\/[^\s]+)/g
    
        return content.replace(urlRegex, (url) => `<${url}>`)
    },

    init:function(){
        return `[ ${"OK".green} ] "Util" module loaded successfully.`
    }
}

export default util