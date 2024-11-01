const discordIdRegex = /^[0-9]{17,19}$/;

module.exports = {
    name: "discordId",
    parse: function(val, extra = {}){
        var matchId = val.match(discordIdRegex);
        if(matchId == null) return "invalid";
        return {value:val, key:val, display:val};
    }
};