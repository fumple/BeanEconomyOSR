module.exports = {
    name: "int",
    parse: function(val, extra = {}){
        var value = new Number(val);
        if(isNaN(value) && !(extra.allowedStrings||[]).includes(val)) return "invalid";
        value = parseInt(value);
        return {value:value||val, key:value||val, display:value||val};
    }
};