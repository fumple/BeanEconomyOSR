const Discord = require("discord.js");
class ParserRegistry{
    _client;
    _parsers = {};
    constructor(client){
        this._client = client;
    }
    register(name, parser){
        this._parsers[name] = function (val, extra = {}) {
            if(val == null) return "null";
            return parser.bind(this)(val.toString(), extra);
        };
    }
    unregister(name){
        delete this._parsers[name];
    }
    newParser(guild = null, user = null, channel = null){
        return new Parser(this._parsers, this._client, guild, user, channel);
    }
}
class Parser{
    _client;
    _guild;
    _user;
    _channel;
    _interactive;
    _parsers;
    constructor(parsers, client, guild = null, user = null, channel = null){
        this._client = client;
        this._guild = guild;
        this._user = user;
        this._channel = channel;
        this._interactive = channel != null && user != null;
        this._parsers = parsers;
    }
    parse(type, val, extra = {}){
        var parsed = this._parsers[type].bind(this)(val, extra);
        return parsed instanceof Promise ? parsed : new Promise(k=>k(parsed));
    }
}
String.prototype.toParserKey = function (){ return this; }; 
String.prototype.toParserDisplay = function (){ return this; }

Number.prototype.toParserKey = function (){ return this.toString(); }
Number.prototype.toParserDisplay = function (){ return this.toString(); }

Boolean.prototype.toParserKey = function (){ return this.toString(); }
Boolean.prototype.toParserDisplay = function (){ return this.toString(); }

//Object.prototype.toParserKey = function (){ return JSON.stringify(this); }
//Object.prototype.toParserDisplay = function (){ return JSON.stringify(this, null, 4); }

Discord.User.prototype.toParserKey = function (){ return this.id }
Discord.User.prototype.toParserDisplay = function (){ return this.toString()+" ("+this.tag+") ["+this.id+"]" }

Discord.GuildMember.prototype.toParserKey = function (){ return this.user.toParserKey() }
Discord.GuildMember.prototype.toParserDisplay = function (){ return this.user.toParserKey() }

Discord.Guild.prototype.toParserKey = function (){ return this.id }
Discord.Guild.prototype.toParserDisplay = function (){ return this.name+" ["+this.id+"]" }

Discord.Role.prototype.toParserKey = function (){ return this.id }
Discord.Role.prototype.toParserDisplay = function (){ return this.toString()+" ("+this.name+") ["+this.id+"]" }

Discord.Channel.prototype.toParserKey = function (){ return this.id }
Discord.Channel.prototype.toParserDisplay = function (){ return this.name+" ["+this.id+"]" }

//Discord.TextChannel.prototype.toParserKey = function (){ return this.id }
Discord.TextChannel.prototype.toParserDisplay = function (){ return this.toString()+" ("+this.name+") ["+this.id+"]" }

//Discord.StoreChannel.prototype.toParserKey = function (){ return this.id }
Discord.StoreChannel.prototype.toParserDisplay = function (){ return this.toString()+" ("+this.name+") ["+this.id+"]" }
module.exports = ParserRegistry;
