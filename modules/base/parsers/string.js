module.exports = {
    name: "string",
    parse: function(val, extra = {}){
        return {value:val, key:val, display:val};
    }
};