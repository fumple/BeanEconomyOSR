const {TimeSpan} = require('timespan');
const timespanRegex = /([0-9]*) ?([wdhms])[a-z]*/gi;

module.exports = {
    name: "timespan",
    parse: function(val, extra = {}){
        return new Promise(async (k,no)=>{
            var timespan = new TimeSpan(0);
            var match = [...val.matchAll(timespanRegex)];
            if(match.length == 0) return no("invalid:1");
            for(var m of match){
                m[1] = parseInt(m[1])
                switch(m[2]){
                    case "w": timespan.addDays(m[1]*7); break;
                    case "d": timespan.addDays(m[1]); break;
                    case "h": timespan.addHours(m[1]); break;
                    case "m": timespan.addMinutes(m[1]); break;
                    case "s": timespan.addSeconds(m[1]); break;
                    default: return no("invalid:2");
                }
            }
            return k({value:timespan, key:timespan.totalSeconds()+"s", display:["days","hours","minutes","seconds"].map(e=>timespan[e]+e.substring(0,1)).join("")});
        })
    }
}