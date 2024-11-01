const discordIdRegex = /^[0-9]{17,19}$/;
const discordUserMentionRegex = /^<@!?([0-9]{17,19})>$/;

module.exports = {
    name: "user",
    parse: function(val, extra = {}){
        return new Promise(async (k,no)=>{
            var matchId = val.match(discordIdRegex);
            var matchMention = val.match(discordUserMentionRegex);
            var targetId;
            if(matchId != null) targetId = matchId[0];
            else if(matchMention != null) targetId = matchMention[1];
            if(targetId == null){
                return k(this.parse("choice", val, {
                    choices:Array.from(this._client.users.cache.values()).map(e=>({key:e.tag,value:e})),
                    name:extra.name
                }));
            }
            var value = await this._client.users.fetch(targetId).catch(()=>{});
            if(value == null) return no("notfound");
            return k({value:value, key:value.id, display:value.toString()});
        })
    }
}