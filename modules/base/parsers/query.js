const queryString = require('query-string');

module.exports = {
    name: "query",
    parse: function(val, extra = {}){
        try{
            const parsed = queryString.parse(val, {parseBooleans:true,parseNumbers:true});
            return {value:parsed, key:val, display:val};
        }catch(e){
            return "invalid";
        }
    }
}