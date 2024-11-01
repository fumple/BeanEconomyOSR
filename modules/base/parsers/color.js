const { Util:{resolveColor}, Constants:{Colors} } = require("discord.js");

module.exports = {
    name: "color",
    parse: function(val, extra = {}){
        try{
            if(parseInt(val) == val.toString()) val = parseInt(val);
            const resolve = resolveColor(val);
            const displayName = (Object.entries(Colors).find(e=>e[1]==resolve)||[])[0];
            return {value:resolve, key:resolve, display:displayName||"#"+resolve.toString(16).toUpperCase()};
        }catch(e){
            return "invalid";
        }
    }
}