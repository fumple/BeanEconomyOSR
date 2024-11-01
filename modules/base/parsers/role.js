const discordIdRegex = /^[0-9]{17,19}$/;
const discordRoleMentionRegex = /^<@&([0-9]{17,19})>$/;

module.exports = {
    name: "role",
    parse: function(val, extra = {}){
        if(this._guild == null) return "guildonly";
        return new Promise(async (k,no)=>{
            var matchId = val.match(discordIdRegex);
            var matchMention = val.match(discordRoleMentionRegex);
            var targetId;
            if(matchId != null) targetId = matchId[0];
            else if(matchMention != null) targetId = matchMention[1];
            if(targetId == null){
                return k(this.parse("choice", val, {
                    choices:Array.from(this._guild.roles.cache.values()).map(e=>({key:e.name,value:e})),
                    name:extra.name
                }));
            }
            var value = await this._guild.roles.fetch(targetId).catch(()=>{});
            if(value == null) return no("notfound");
            return k({value:value, key:value.id, display:value.toString()});
        })
    }
}