const { Util:{parseEmoji} } = require("discord.js");

module.exports = {
    name: "emoji",
    parse: function(val, extra = {}){
        try{
            const resolve = parseEmoji(val);
            const display = resolve.id == null ? resolve.name : "<"+(resolve.animated ? "a" : "")+":"+resolve.name+":"+resolve.id+">";
            return {value:display, key:display, display:display};
        }catch(e){
            return "invalid";
        }
    }
}