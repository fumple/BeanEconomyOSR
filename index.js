const Discord = require("discord.js");
const fs = require("fs");
const config = require("./config.json");
const Database = require("./database");
const Parser = require("./parser");
const argp = require("arg");
const paste = require("./paste");
const client = new Discord.Client({presence:{status:"online",activity:{name:"startup.exe",type:"PLAYING"}}, intents:["DIRECT_MESSAGES", "GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES"]});

process.env.TZ = "UTC"; 
process.chdir(__dirname);

const cmddefault = {
    args:[],
    nargs:{}
}

BigInt.prototype.toJSON = function(){
    return this.toString();
}

client._waitingForAnswer = [];
Discord.TextChannel.prototype.awaitMessage = function (user, arg2 = {}){
    arg2.max = 1;
    client._waitingForAnswer = client._waitingForAnswer.concat({u:user,c:this.id});
    return new Promise(async (k,no)=>{
        this.awaitMessages(m=>m.author.id==user||user==null, arg2)
            .then(result=>{
                client._waitingForAnswer = client._waitingForAnswer.filter(e=>e.u!=user||e.c!=this.id);
                if(result.size == 0) return k(null);
                else return k(result.values().next().value);
            })
            .catch(()=>{
                client._waitingForAnswer = client._waitingForAnswer.filter(e=>e.u!=user||e.c!=this.id);
                return no("time");
            });
    })
}
Discord.TextChannel.prototype.awaitComponents = function (user, apiMessage){
    client._waitingForAnswer = client._waitingForAnswer.concat({u:user,c:this.id});
    return new Promise(async (k,no)=>{
        const msg = await client.api.channels[this.id].messages.post({data:apiMessage}).then(d => client.actions.MessageCreate.handle(d).message);
        var listener = async p=>{
            if(p.t != "INTERACTION_CREATE" || p.d.type != 3) return;
            if(p.d.message.id != msg.id) return;
            if(user != null) if(p.d.member.user.id != user) {
                return await client.api.interactions[p.d.id][p.d.token].callback.post({data:{
                    type:4,
                    data:{
                        content:client.$.emoji.xmark+" Hey! Don't touch that! It's meant for someone else!",
                        flags:64
                    }
                }});
            }
            cleanup(p.d.data.custom_id);
            await client.api.interactions[p.d.id][p.d.token].callback.post({data:{
                type:6
            }});
        }
        var cleanup = async r=>{
            client.off("raw", listener);
            clearTimeout(cleanupTimeout);
            client._waitingForAnswer = client._waitingForAnswer.filter(e=>e.u!=user||e.c!=this.id);
            if(r != null) k(r);
            else no();
            for(var i of apiMessage.components){
                for(var j of i.components){
                    j.disabled = true;
                }
            }
            if(r!=null)apiMessage.components = [{type:1,components:[apiMessage.components.map(e=>e.components.find(e=>e.custom_id==r)).find(e=>e!=null)]}];
            await client.api.channels[msg.channel.id].messages[msg.id].patch({data:apiMessage});
        }
        client.on("raw", listener);
        var cleanupTimeout = setTimeout(_=>cleanup(), 30000);
    })
}
/**
 * 
 * @param {string} content 
 * @param {Discord.MessageEmbed} embed 
 * @param {*} reply 
 * @param {Discord.MessageOptions} options 
 * @returns {Promise<Discord.Message>}
 */
Discord.TextChannel.prototype.s = function (content,embed=null,reply=null,options={}){
    //options.content = content;
    if(options.embed == null)  options.embed = embed;
    if(reply != null)           options.replyTo = reply;
    options.allowedMentions = {repliedUser: false, ...options.allowedMentions}
    return this.send(content, options);
}
Discord.Message.prototype.confirm = function (user, action, danger = true){
    return new Promise(async (k,no)=>{
        const components = [{
            type: 1,
            components: [{
                type:2,
                style:danger ? 4 : 1,
                label:"Yes",
                custom_id:"y"
            },{
                type:2,
                style:2,
                label:"No",
                custom_id:"n"
            }]
        }]
        const message = {embed:new Discord.MessageEmbed().setColor(danger ? "RED" : "YELLOW").setDescription("⚠️ **Are you sure that you want to** "+action+"?").toJSON(),message_reference:{message_id:this.id}};
        this.channel.awaitComponents(user, {...message, components}).then(r=>k(r=="y")).catch(no);
    })
}
Discord.MessageEmbed.prototype.addAuthor = function (user){
    if(user.user != null){
        return this.setAuthor(user.displayName+ ` (${user.user.tag})`, user.user.avatarURL({dynamic:true}));
    }
    return this.setAuthor(user.tag, user.avatarURL({dynamic:true}));
}
Discord.MessageEmbed.prototype.addColor = async function (gid){
    return this.setColor(parseInt((await client.settings.get("base", gid, "colors.primary")).value));
}
Date.prototype.toUTC = function(){
    return new Date(this.getTime() + this.getTimezoneOffset() * 60000);
}
async function filterAsync(arr, callback) {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i=>i!==fail)
}
client.findCommands = (_name, _subname = null, includeWildcard = false, loopNr = 0)=>{
    if(loopNr > 25) return [];
    var name = _name.toLowerCase();
    var loopCount = 0;
    var foundCmds = [];
    var cmds = client._commands.filter(c=>c.name.toLowerCase() == name || (includeWildcard && c.name == "*"));
    for(var cmd of cmds){
        if(cmd.redirect != null) foundCmds.push(...client.findCommands(cmd.redirect, null, false, loopNr+1).map(e=>e.cmd))
        else {foundCmds.push(cmd);}
    }
    var foundAllCmds = [];
    for(var foundCmd of foundCmds){
        var parent = null;
        var foundSubcmd = null;
        if(_subname != null && foundCmd.subcommands != null){
            var name = _subname;
            var loopCount = 0;
            while(true){
                if(loopCount > 25) break;
                var cmd = foundCmd.subcommands.find(c=>c.name.toLowerCase() == name);
                if(cmd == null) break;
                if(cmd.redirect != null) name = cmd.redirect;
                else {parent = foundCmd; foundSubcmd = cmd; break;}
                loopCount += 1;
            }
        }
        foundAllCmds.push({cmd:foundSubcmd||foundCmd,sub:parent!=null,parent:parent});
    }
    return foundAllCmds;
}

paste.setConfig(config.pasteHost, config.pasteToken);

client._modules = [];
client._commands = [];
client._apiEndpoints = [];
client._config = config;
client.parser = new Parser(client);
if(config.database != null) {
    client.database = new Database(config.database);
    client.settings = new (require("./settings"))(client);
}
client.$ = {};

function parseStringWithQuotes(str){
    var lastchar = '',
        inQuotes = '',
        finalcmdarr = [],
        currentcmditem = "";
    for(var char of str){
        if(char == '\\' && lastchar != '\\'){
            lastchar = char;
            continue;
        }/*
        else if(char == '\\' && lastchar == '\\'){
            currentcmditem += char;
        }
        else if(char == " " && inQuotes){
            currentcmditem += char;
        }*/
        else if(char == " " && !inQuotes){
            if(currentcmditem != ""){
                //finalcmdarr = finalcmdarr.concat({text:currentcmditem, full:currentcmditem});
                finalcmdarr = finalcmdarr.concat(currentcmditem);
                currentcmditem = "";
            }
            lastchar = char;
            continue;
        }
        else if(char == "\"" && lastchar != "\\"){
            if(currentcmditem != ""){
                //finalcmdarr = finalcmdarr.concat({text:currentcmditem, full:(inQuotes ? "\""+currentcmditem+"\"" : currentcmditem)});
                finalcmdarr = finalcmdarr.concat(currentcmditem);
                currentcmditem = "";
            }
            inQuotes = !inQuotes;
            lastchar = char;
            continue;
        }
        lastchar = char;
        currentcmditem += char;
    }
    if(currentcmditem != ""){
        //finalcmdarr = finalcmdarr.concat({text:currentcmditem, full:(inQuotes ? "\""+currentcmditem : currentcmditem)});
        finalcmdarr = finalcmdarr.concat(currentcmditem);
        currentcmditem = "";
    }
    return finalcmdarr;
}

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log('clean');
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit(exitCode);
}
//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('SIGTERM', exitHandler.bind(null, {exit:true}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
//catches uncaught exceptions
process.on('uncaughtException', e=>{
    if(process.send != null) process.send({type:"error", message:e.message, stack:e.stack, name:e.name});
})
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

client.on("ready", async ()=>{
    try{
        console.log("Logged in as "+client.user.tag+" ("+client.user.id+")");
        console.log("Loading modules...");
        for(var f of fs.readdirSync(__dirname+"/modules")){
            console.log(f,__dirname+"/modules/"+f);
            var m = require(__dirname+"/modules/"+f);
            if(m.enabled === false) continue;
            m.id = f;
            client._modules.push(m);
            var commands = [],
                apiEndpoints = []; // OSR: No longer used
            await m.register(client, commands, apiEndpoints);
            client._commands.push(...commands.map(el=>{
                el.module = f;
                if(el.subcommands != null) el.subcommands = el.subcommands.map(e=>{e.module=f;return e});
                return el;
            }));
        }
        console.log("Processing aliases...");
        for(var c of client._commands){
            if(c.aliases == null) continue;
            if(c.aliases.length == 0) continue;
            for(var a of c.aliases){
                client._commands.push({
                    name:a,
                    redirect:c.name
                })
            }
        }
        console.log("Pre-caching guild members... 0/"+client.guilds.cache.size+" guilds cached"); //TODO: Cache new guilds
        var i = 0;
        for(var g of client.guilds.cache.values()){
            console.log("Caching "+g.name+"...");
            await g.members.fetch();
            i++;
            console.log("Cached "+g.name+"! "+`${i}/${client.guilds.cache.size} cached`);
        }
        client._started = true;
        await client.user.setActivity({name:config.prefix,type:"LISTENING"});
    }
    catch (e) {
        await client.user.setActivity({name:"failed to start the bot?",type:"PLAYING"});
        console.error("Failed to start the bot "+e.message);
        await new Promise(k=>setTimeout(k,10000));
        await client.destroy();
    }
});

client.processCommand = async (msg, customContent = null, cmdmeta = null, ignoreBot = true)=>{
    if(!client._started) return;
    if(msg.channel?.s == null) return;
    if(client._config.ownerOnly && !client._config.owners.includes(msg.author.id)) return;
    if(ignoreBot && msg.author.bot) return;
    if(client._waitingForAnswer.find(e=>e.u==msg.author.id&&e.c==msg.channel.id) != null) return;

    var prefixes = [
        config.prefix,
        "!", // OSR: This is only used for commands with short prefix = true, why?
        "<@"+client.user.id+">",
        "<@!"+client.user.id+">"
    ];
    if(customContent == null){
        var foundPrefix = prefixes.find(p=>msg.content.startsWith(p));
        if(foundPrefix == null) return;
        var content = msg.content.substr(foundPrefix.length);
    }
    else var content = customContent;
    var parsedContent = parseStringWithQuotes(content);
    //var parsedContent = content.split(" ");
    var cmdname = (parsedContent[0] || "").toLowerCase();
    var uargs = parsedContent.slice(1);
    var cmdsfound = cmdmeta != null ? [{cmd:cmdmeta}] : client.findCommands(cmdname, uargs[0], true);
    var cmdfound;
    
    var allRoles = [];
    for(var g of client.guilds.cache.values()){
        var m = g.members.resolve(msg.author.id);
        if(m == null) continue;
        allRoles.push(...m.roles.cache.values());
    }

    /** @type {import("../../../typedef").EarlyCTX} */
    var earlyctx = {
        client,
        msg,
        prefix:foundPrefix,
        cmdname,
        $:client.$,
        allRoles
    }
    cmdsfound = await filterAsync(cmdsfound, e=>{
        if(!e.cmd.shortPrefix && foundPrefix == "!") return false;
        if(e.cmd.shouldRun != null) 
            return e.cmd.shouldRun(earlyctx)
        return true;
    });

    let lock = await client.settings.get("base", "*", "lock");
    if(cmdsfound.length >= 1 && !client._config.owners.includes(msg.author.id) && lock.value != null){
        return await msg.channel.s(
            `**Bot locked**\nSorry, but I am currently locked from being used\nBot owners can unlock me by using ${client._config.prefix}unlock\n\n${lock.value}`,
            null, msg, {allowedMentions:{parse:[]}}
        );
    }

    if(cmdsfound.length > 1){
        msg.channel.s("", await new Discord.MessageEmbed()
            .setTitle("Multiple commands found")
            .setDescription("Send one of the numbers below\n"+cmdsfound.map((v,i)=>{
                return "**"+(i+1)+".** "+v.cmd.module+"::"+(v.parent||v.cmd).name+":"+(v.sub ? v.cmd.name : "")
            }).join("\n"))
            .setFooter("Or type `cancel`")
            .addColor((msg.guild||msg.author).id)
        , msg)
        var usermsg = await msg.channel.awaitMessage(msg.author.id, {time:30000,errors: ['time']}).catch(e=>e);
        if(usermsg == "time" || usermsg == null) return msg.channel.send("Timed out");
        if(usermsg.content == "cancel") return msg.channel.send("Cancelled");
        var num = parseInt(usermsg.content);
        if(num >= 1 && num <= cmdsfound.length){
            cmdfound = cmdsfound[num-1]
        }
        else{
            return await msg.channel.send("Cancelled");
        }
    }
    else if(cmdsfound.length == 1) cmdfound = cmdsfound[0];
    if(cmdfound == null) return;
    var {cmd, sub} = cmdfound;
    if(sub) uargs = uargs.slice(1);
    cmd = {...cmddefault, ...cmd};

    if(cmd.guildOnly && msg.guild == null) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used in servers", null, msg);
    if(cmd.superUserOnly && !client._config.superUsers.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my super user", null, msg);
    if(cmd.ownerOnly && !client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
    if(msg._author != null) {
        if(cmd.superUserOnly && !client._config.superUsers.includes(msg._author.id)) return await msg.channel.s(client.$.emoji.xmark+" [sudo] This command can only be used by my super user", null, msg);
        if(cmd.ownerOnly && !client._config.owners.includes(msg._author.id)) return await msg.channel.s(client.$.emoji.xmark+" [sudo] This command can only be used by my owners", null, msg);
    }
    if(cmd.module == "debug" && !client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" Debug commands can only be ran by my owners", null, msg);

    /** @type {import("../../../typedef").PreCTX} */
    var prectx = {
        client,
        msg,
        module:cmd.module,
        prefix:foundPrefix,
        cmdname,
        allRoles,
        $:client.$
    }

    if(client.database != null && msg.guild != null){
        var cooldown = await client.database.cooldown(cmd.name, msg.guild.id, msg.author.id);
        if(cooldown != null){
            var diff = cooldown - new Date();
            var remaining = diff / 1000;
            if(remaining > 0){
                var seconds = Math.floor(remaining % 60);
                var minutes = Math.floor(remaining / 60) % 60;
                var hours = Math.floor(Math.floor(remaining / 60) / 60) % 24;
                var days = Math.floor(Math.floor(Math.floor(remaining / 60) / 60) / 24);
                return await msg.channel.s("", new Discord.MessageEmbed({description:"You must wait `"+
                (days != 0 ? (days != 1 ? days+" days, " : days+" day, ") : "")+
                (hours != 0 ? (hours != 1 ? hours+" hours, " : hours+" hour, ") : "")+
                (minutes != 0 ? (minutes != 1 ? minutes+" minutes and " : minutes+" minute and ") : "")+
                (seconds != 1 ? seconds+" seconds" : seconds+" second")
                +"` before you can use this command again", color:"RED"}), msg);
            }
        }
    }

    if(typeof cmd.canRun == "function"){
        var res = await cmd.canRun(prectx);
        if(typeof res == "string"){
            return await msg.channel.s(client.$.emoji.xmark+" "+res, null, msg, {allowedMentions:{parse:[]}});
        }
        else if(res === false){
            return await msg.channel.s(client.$.emoji.xmark+" You can't use this command", null, msg);
        }
    }
    else if(typeof cmd.canRun == "string"){
        if(cmd.canRun.includes("::")){
            var [confmodule, confkey] = cmd.canRun.split("::");
            var confmeta = client.settings.getKey(confmodule, confkey);
            if(confmeta == null) return await msg.channel.s(client.$.emoji.xmark+" An internal error has occured, please contact the bot administrator `(Code: canRun/confmeta=null)`", null, msg);
            if(confmeta.type == "role"){
                var confvalue = (await client.settings[confmeta.parent != null ? "getWithParent" : "get"](confmodule, confmeta.guildIdUsed === false ? "*" : (msg.guild||msg.author).id, confkey, true)).map(e=>e.value);
                if(confvalue.length > 0) {
                    if(prectx.allRoles.findIndex(r=>confvalue.includes(r.id)) == -1) return await msg.channel.s(client.$.emoji.xmark+" You don't have the required roles to use this command", null, msg);
                } else if(client._config.owners.includes(msg.author.id)){
                    return await msg.channel.s(client.$.emoji.xmark+" This command has no roles that can use it, please add a role to `"+cmd.canRun+"` using `settings add "+confmodule+" * "+confkey+" @role` before using this command", null, msg);
                } else {
                    return await msg.channel.s(client.$.emoji.xmark+" Bot misconfigured, for more information one of my owners must run this command", null, msg);
                }
            }
        } // OSR: So if canRun is not properly formatted the check is just ignored????
    }

    //argp
    var parsednargs = argp(Object.fromEntries(Object.entries(cmd.nargs).map(e=>[e[0], e[1].ntype])), {
        argv:uargs.map(e => {
            var tryparse = Number(e);
            if(!isNaN(tryparse) && tryparse.toString() == e) return tryparse;
            return e;
        }),
		permissive: true
    });
    uargs = parsednargs._.map(e=>e.toString());
    var nargs = {};
    var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
    for(var narg of Object.entries(cmd.nargs)){
        var argdef = narg[1];
        if(typeof argdef.ntype == "string") continue;
        if(!Array.isArray(parsednargs[narg[0]])) parsednargs[narg[0]] = [parsednargs[narg[0]]];
        for(var _u of parsednargs[narg[0]]){
            var unparsed = _u;
            if(unparsed != null && unparsed.trim() != ""){
                var parsed = await parser.parse(argdef.type, unparsed, {...(argdef.parserArgs||{}), name:argdef.name}).catch(e=>e);
                if(parsed == "cancel") return await msg.channel.s(client.$.emoji.xmark+" Argument prompt for `--"+argdef.name+`\` cancelled`, null, msg);
                if(typeof parsed == 'string') return await msg.channel.s(client.$.emoji.xmark+" Invalid value provided for argument `--"+argdef.name+`\` (Type: ${argdef.type}) [${parsed}]`, null, msg);
                if(parsed.value == null && argdef.default === undefined){
                    return await msg.channel.s(client.$.emoji.xmark+" Invalid argument provided for `--"+argdef.name+`\` (Type: ${argdef.type})`, null, msg);
                }
                nargs[narg[0]] = parsed.value;
                if(nargs[narg[0]] == null && argdef.default !== undefined){
                    if(typeof argdef.default == "function") nargs[narg[0]] = argdef.default(prectx);
                    else nargs[narg[0]] = argdef.default;
                }
            }
            else if(argdef.default === undefined){
                return await msg.channel.s(client.$.emoji.xmark+" Required argument not provided for `--"+argdef.name+`\` (Type: ${argdef.type})`, msg);
            }
            else{
                if(typeof argdef.default == "function") nargs[narg[0]] = argdef.default(prectx);
                else nargs[narg[0]] = argdef.default;
            }
        }
    }

    //Parse arguments
    var args = [];
    if(cmd.args.length > 0){
        for(var argnr in cmd.args){
            argnr = parseInt(argnr);
            var argdef = cmd.args[argnr];
            var unparsed = (argnr+1 != cmd.args.length) ? uargs[argnr] : uargs.slice(argnr).join(" ");
            if(unparsed != null && unparsed.trim() != ""){
                var parsed = await parser.parse(argdef.type, unparsed, {...(argdef.parserArgs||{}), name:argdef.name}).catch(e=>e);
                if(parsed == "cancel") return await msg.channel.s(client.$.emoji.xmark+" Argument prompt for `"+argdef.name+`\` cancelled`, null, msg);
                if(typeof parsed == 'string') return await msg.channel.s(client.$.emoji.xmark+" Invalid value provided for argument `"+argdef.name+`\` (Type: ${argdef.type}) [${parsed}]`, null, msg);
                if(parsed.value == null && argdef.default === undefined){
                    return await msg.channel.s(client.$.emoji.xmark+" Invalid argument provided for `"+argdef.name+`\` (Type: ${argdef.type})`, null, msg);
                }
                args[argnr] = parsed.value;
                if(args[argnr] == null && argdef.default !== undefined){
                    if(typeof argdef.default == "function") args[argnr] = argdef.default(prectx);
                    else args[argnr] = argdef.default;
                }
            }
            else if(argdef.default === undefined){
                return await msg.channel.s(client.$.emoji.xmark+" Required argument not provided for `"+argdef.name+`\` (Type: ${argdef.type})`, null, msg);
            }
            else{
                if(typeof argdef.default == "function") args[argnr] = argdef.default(prectx);
                else args[argnr] = argdef.default;
            }
        }
    }

    /** @type {import("../../../typedef").CTX} */
    var ctx = {
        ...prectx,
        args,
        nargs
    }

    if(typeof cmd.canRunArgs == "function"){
        var res = await cmd.canRunArgs(ctx);
        if(typeof res == "string"){
            return await msg.channel.s(client.$.emoji.xmark+" "+res, null, msg, {allowedMentions:{parse:[]}});
        }
        else if(res === false){
            return await msg.channel.s(client.$.emoji.xmark+" You can't use this command", null, msg);
        }
    }

    if(client.database != null && msg.guild != null && cmd.cooldown != null) client.database.setcooldown(cmd.name, msg.guild.id, msg.author.id, cmd.cooldown);
    await cmd.run(ctx).catch(e=>{
        msg.channel.s(client.$.emoji.xmark+" Something went wrong...");
        console.error(e);
    });
}

client.on("message", client.processCommand);

client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
// client.on("debug", (e) => console.info(e));

client.on("raw", async p => {
    if(p.t != "INTERACTION_CREATE" || p.d.type != 3) return;
    p.d.message.author = (p.d.member||p.d).user;
    let userId = (p.d.member||p.d).user.id;
    if(p.d.data.custom_id.startsWith('!')) {
        await client.api.interactions[p.d.id][p.d.token].callback.post({data:{
            type:4,
            data:{
                content:`<@${userId}>: `+p.d.data.custom_id,
                allowed_mentions:{
                    parse: {}
                }
            }
        }});
        try {
            let msg = await client.api.webhooks[p.d.application_id][p.d.token].messages["@original"].get();
            msg.author = (p.d.member||p.d).user;
            let dmsg = new Discord.Message(client, msg, await client.channels.fetch(p.d.channel_id));
            client.processCommand(dmsg, p.d.data.custom_id.substr(1), null, false);
        } catch (e) {
            console.error(e)
            client.api.webhooks[p.d.application_id][p.d.token].messages["@original"].patch({data:{
                content:`<@${userId}>: `+p.d.data.custom_id+'\nSomething went wrong...'
            }}).catch(()=>{});
        }
    } else if(p.d.data.custom_id.startsWith('?')) {
        if(p.d.message.content != `<@${userId}>`) return;
        await client.api.interactions[p.d.id][p.d.token].callback.post({data:{
            type:7,
            data:{
                components: []
            }
        }});
        try {
            let dmsg = new Discord.Message(client, p.d.message, await client.channels.fetch(p.d.channel_id));
            client.processCommand(dmsg, p.d.data.custom_id.substr(1), null, false);
        } catch (e) {
            console.error(e)
            client.api.webhooks[p.d.application_id][p.d.token].messages.post({data:{
                content:`<@${userId}>: `+p.d.data.custom_id+'\nSomething went wrong...'
            }}).catch(()=>{});
        }
    }
})

client._started = false;

client.login(config.token);

module.exports = client;
