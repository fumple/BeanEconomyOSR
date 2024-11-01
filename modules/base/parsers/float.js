module.exports = {
    name: "float",
    parse: function(val, extra = {}){
        var value = new Number(val);
        if(isNaN(value) && !(extra.allowedStrings||[]).includes(val)) return "invalid";
        return {value:value, key:value, display:value};
    }
}