module.exports = {
    name: "locale",
    parse: function(val, extra = {}){
        try{
            var match = Intl.DateTimeFormat.supportedLocalesOf(val);
            return {value:match[0], key:match[0], display:match[0]};
        }
        catch {
            return "invalid";
        }
    }
}