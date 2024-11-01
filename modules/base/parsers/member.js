const discordIdRegex = /^[0-9]{17,19}$/;
const discordUserMentionRegex = /^<@!?([0-9]{17,19})>$/;

module.exports = {
    name: "member",
    parse(val,extra = {}){
        if(this._guild == null) return "guildonly";
        return new Promise(async (k,no)=>{
            var matchId = val.match(discordIdRegex);
            var matchMention = val.match(discordUserMentionRegex);
            var targetId;
            if(matchId != null) targetId = matchId[0];
            else if(matchMention != null) targetId = matchMention[1];
            if(targetId == null){
                return k(this.parse("choice", val, {
                    choices:Array.from(this._guild.members.cache.values()).map(e=>({key:e.displayName+" "+e.user.tag,value:e})),
                    name:extra.name
                }));
            }
            var value = await this._guild.members.fetch(targetId).catch(()=>{});
            if(value == null) return no("notfound");
            return k({value:value, key:value.id, display:value.toString()});
        })
    }
}