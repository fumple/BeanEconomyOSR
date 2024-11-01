module.exports = {
    name: "bool",
    parse: function (val, extra = {}){
        if(val.toLowerCase != null) val = val.toLowerCase();
             if(val == 1 || val == "1" || val === true  || val == "true"  || val == "yes" || val == "y") return {value:true, key:true, display:"True"};
        else if(val == 0 || val == "0" || val === false || val == "false" || val == "no"  || val == "n") return {value:false, key:false, display:"False"};
        return "invalid";
    }
}