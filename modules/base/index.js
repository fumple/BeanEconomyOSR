const { Client } = require("discord.js");
const fs = require("fs");
const path = require('path');

const _moduleID = path.basename(__dirname);

const { MessageEmbed, Util:{resolveColor,parseEmoji}, Constants:{Colors} } = require("discord.js");
const queryString = require('query-string');
const {TimeSpan} = require('timespan');

const discordIdRegex = /^[0-9]{17,19}$/;
const discordUserMentionRegex = /^<@!?([0-9]{17,19})>$/;
const discordRoleMentionRegex = /^<@&([0-9]{17,19})>$/;
const discordChannelMentionRegex = /^<#([0-9]{17,19})>$/;
const discordCustomEmojiRegex = /^<(a)?:(.{2,32}):([0-9]{17,19})>$/;
const timespanRegex = /([0-9]*) ?([wdhms])[a-z]*/gi;

/** 
 * Register module
 * @param {Client} client - Discord
 * @param {Command[]} commands - Commands to register
 * @param {APIEndpoint[]} apiEndpoints - API Endpoints to register
 */
function register(client, commands, apiEndpoints){
    client.$.locale = async (u,g)=>{
        var userPreference = await client.settings.getRaw("base", u, "locale").catch(()=>([]));
        if(userPreference.length == 0){
            if(g == null) return "en-US";
            var guildPreference = await client.settings.get("base", g, "locale").catch(()=>([]));
            if(guildPreference == null) return "en-US";
            return guildPreference.value;
        }
        return userPreference[0].value;
    }
    client.$.localec = ctx=>client.$.locale(ctx.msg.author.id, (ctx.msg.guild||{}).id);
    client.$.emoji = {};
    client.$.emoji.xmark = "<:xmark:729670886486966372>";
    client.$.emoji.check = "<:check:729670886499549244>";
    client.$.emoji.online = "<:online:725741546581786685>";
    client.$.emoji.idle = "<:idle:725741546137321513>";
    client.$.emoji.dnd = "<:dnd:725741545965355109>";
    client.$.emoji.offline = "<:offline:725741546674192444>";
    client.$.emoji.loading = "<a:loading:729671381368963113>";
    for(var f of fs.readdirSync(__dirname+"/commands")){
        console.log(f,__dirname+"/commands/"+f);
        commands.push(require(__dirname+"/commands/"+f))
    }
    var parserDefs = [
        ["string", function(val,extra = {}){
            return {value:val, key:val, display:val};
        }],
        ["int", function(val,extra = {}){
            var value = new Number(val);
            if(isNaN(value) && !(extra.allowedStrings||[]).includes(val)) return "invalid";
            value = parseInt(value);
            return {value:value||val, key:value||val, display:value||val};
        }],
        ["discordId", function(val,extra = {}){
            var matchId = val.match(discordIdRegex);
            if(matchId == null) return "invalid";
            return {value:val, key:val, display:val};
        }],
        ["float", function(val,extra = {}){
            var value = new Number(val);
            if(isNaN(value) && !(extra.allowedStrings||[]).includes(val)) return "invalid";
            return {value:value, key:value, display:value};
        }],
        ["bool", function(val,extra = {}){
            var value = false;
            if(val.toLowerCase != null) val = val.toLowerCase();
                 if(val == 1 || val == "1" || val === true  || val == "true"  || val == "yes" || val == "y") return {value:true, key:true, display:"True"};
            else if(val == 0 || val == "0" || val === false || val == "false" || val == "no"  || val == "n") return {value:false, key:false, display:"False"};
            return "invalid";
        }],
        ["color", function(val,extra = {}){
            try{
                if(parseInt(val) == val.toString()) val = parseInt(val);
                const resolve = resolveColor(val);
                const displayName = (Object.entries(Colors).find(e=>e[1]==resolve)||[])[0];
                return {value:resolve, key:resolve, display:displayName||"#"+resolve.toString(16).toUpperCase()};
            }catch(e){
                return "invalid";
            }
        }],
        ["emoji", function(val,extra = {}){
            try{
                const resolve = parseEmoji(val);
                const display = resolve.id == null ? resolve.name : "<"+(resolve.animated ? "a" : "")+":"+resolve.name+":"+resolve.id+">";
                return {value:display, key:display, display:display};
            }catch(e){
                return "invalid";
            }
        }],
        ["query", function(val,extra = {}){
            try{
                const parsed = queryString.parse(val, {parseBooleans:true,parseNumbers:true});
                return {value:parsed, key:val, display:val};
            }catch(e){
                return "invalid";
            }
        }],
        ["user", function(val,extra = {}){
            return new Promise(async (k,no)=>{
                var matchId = val.match(discordIdRegex);
                var matchMention = val.match(discordUserMentionRegex);
                var targetId;
                if(matchId != null) targetId = matchId[0];
                else if(matchMention != null) targetId = matchMention[1];
                if(targetId == null){
                    return k(this.parse("choice", val, {
                        choices:Array.from(this._client.users.cache.values()).map(e=>({key:e.tag,value:e})),
                        name:extra.name
                    }));
                }
                var value = await this._client.users.fetch(targetId).catch(()=>{});
                if(value == null) return no("notfound");
                return k({value:value, key:value.id, display:value.toString()});
            })
        }],
        ["guild", function(val,extra = {}){
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
        }],
        ["member", function(val,extra = {}){
            if(this._guild == null) return "guildonly";
            return new Promise(async (k,no)=>{
                var matchId = val.match(discordIdRegex);
                var matchMention = val.match(discordUserMentionRegex);
                var targetId;
                if(matchId != null) targetId = matchId[0];
                else if(matchMention != null) targetId = matchMention[1];
                if(targetId == null){
                    return k(this.parse("choice", val, {
                        choices:Array.from(this._guild.members.cache.values()).map(e=>({key:e.displayName+" "+e.user.tag,value:e})),
                        name:extra.name
                    }));
                }
                var value = await this._guild.members.fetch(targetId).catch(()=>{});
                if(value == null) return no("notfound");
                return k({value:value, key:value.id, display:value.toString()});
            })
        }],
        ["role", function(val,extra = {}){
            if(this._guild == null) return "guildonly";
            return new Promise(async (k,no)=>{
                var matchId = val.match(discordIdRegex);
                var matchMention = val.match(discordRoleMentionRegex);
                var targetId;
                if(matchId != null) targetId = matchId[0];
                else if(matchMention != null) targetId = matchMention[1];
                if(targetId == null){
                    return k(this.parse("choice", val, {
                        choices:Array.from(this._guild.roles.cache.values()).map(e=>({key:e.name,value:e})),
                        name:extra.name
                    }));
                }
                var value = await this._guild.roles.fetch(targetId).catch(()=>{});
                if(value == null) return no("notfound");
                return k({value:value, key:value.id, display:value.toString()});
            })
        }],
        ["channel", function(val,extra = {}){
            if(this._guild == null) return "guildonly";
            return new Promise(async (k,no)=>{
                var matchId = val.match(discordIdRegex);
                var matchMention = val.match(discordChannelMentionRegex);
                var targetId;
                if(matchId != null) targetId = matchId[0];
                else if(matchMention != null) targetId = matchMention[1];
                if(targetId == null){
                    return k(this.parse("choice", val, {
                        choices:Array.from(this._client.channels.cache.values()).map(e=>({key:e.name,value:e})),
                        name:extra.name
                    }));
                }
                var value = this._client.channels.resolve(targetId);
                if(value == null) return no("notfound");
                return k({value:value, key:value.id, display:value.toString()});
            })
        }],
        ["choice", function(_val,extra = {}){
            return new Promise(async (_k,_no)=>{
                const no = r=>{_no(r);if(extra.clean){prompts.forEach(v=>v.delete())}}
                const k = r=>{_k(r);if(extra.clean){prompts.forEach(v=>v.delete())}}
                if(extra.choices == "validTypes") extra.choices = Object.keys(this._parsers).map(e=>({key:e,value:e}));
                var ichoices = extra.choices.map(el=>(typeof el == "object" ? {...el, key:el.key.toLowerCase()} : {value:el, key:el.toLowerCase()}));
                var ival = _val.toLowerCase();
                var potential = ichoices.filter(el=>el.key.includes(ival));
                var prompts = [];
                if(potential.length == 0){
                    return no("none");
                }
                else if(potential.length > 15){
                    return no("toomany");
                }
                else if(potential.length == 1) {
                    var value = potential[0].value;
                    return k({value:value, key:value.toParserKey(), display:value.toParserDisplay()});
                }
                else if(this._interactive){
                    prompts.push(await this._channel.send(await new MessageEmbed()
                        .addAuthor(this._user)
                        .setTitle("Mutliple choices found"+(extra.name!=null?" for "+extra.name:""))
                        .setDescription("Type one of the numbers below or type `cancel` to cancel this prompt\n"+potential.map((e,i)=>"**"+(i+1)+".** "+e.value.toParserDisplay()).join("\n"))
                        .addColor((this._guild||this._user).id)
                    ))
                    while(true){
                        var msg = await this._channel.awaitMessage(this._user.id, {time:30000,errors: ['time']}).catch(e=>e);
                        if(msg == "time") return no("time");
                        prompts.push(msg);
                        if(msg.content == "cancel") return no("cancel");
                        var pickedNum = parseInt(msg.content);
                        if(pickedNum != NaN && pickedNum >= 1 && pickedNum <= potential.length){
                            var value = potential[pickedNum-1].value;
                            return k({value:value, key:value.toParserKey(), display:value.toParserDisplay(), msg:msg});
                        }
                        else{
                            prompts.push(this._channel.send("Invalid number provided, type a number from the list above or send `cancel`"));
                        }
                    }
                }
                else{
                    return no("noninteractive");
                }
            })
        }],
        ["timespan", function(val,extra = {}){
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
                return k({value:timespan, key:timespan.totalSeconds()+"s", display:["days","hours","minutes","seconds"].map(e=>timespan[e]+e.substr(0,1)).join("")});
            })
        }],
        ["locale", function(val,extra = {}){
            try{
                var match = Intl.DateTimeFormat.supportedLocalesOf(val);
                return {value:match[0], key:match[0], display:match[0]};
            }
            catch {
                return "invalid";
            }
        }]
    ];
    parserDefs.forEach(e=>client.parser.register(...e));
}

module.exports = {
    name:"Base",
    author:"@fumple",
    settings:[{
        type:"string",
        name:"cmd.ping.message",
        default:["I have been pinged!"],
        array:true
    },{
        type:"color",
        name:"colors.primary",
        default:9905341, //#9724BD
        array:false
    },{
        type:"locale",
        name:"locale",
        default:"en-US",
        array:false,
        guildIdUsed:true
    },{
        type: "string",
        name: "lock",
        array: false,
        guildIdUsed: false
    }],
    register:register
}
