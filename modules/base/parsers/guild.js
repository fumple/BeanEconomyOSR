const discordIdRegex = /^[0-9]{17,19}$/;

module.exports = {
    name: "guild",
    parse: function(val, extra = {}){
        return new Promise(async (k,no)=>{
            var matchId = val.match(discordIdRegex);
            var targetId;
            if(matchId != null) targetId = matchId[0];
            else {
                return k(this.parse("choice", val, {
                    choices:Array.from(this._client.guilds.cache.values()).map(e=>({key:e.name,value:e})),
                    name:extra.name
                }));
            }
            var value = await this._client.guilds.fetch(targetId).catch(()=>{});
            if(value == null) return no("notfound");
            return k({value:value, key:value.id, display:value.name});
        })
    }
}