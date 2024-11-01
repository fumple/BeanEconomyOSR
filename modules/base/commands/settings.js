const { MessageEmbed, Util:{escapeMarkdown} } = require("discord.js");
const paste = require("../../../paste");

async function getParsedVal(client, guild, type, val){
    if(val == null) return "*Not set...*";
    var parser = client.parser.newParser(guild);
    var parsed = await parser.parse(type,val).catch(()=>{});
    return parsed?.display||"*Failed to parse...*";
}
async function getParsedRaw(client, guild, type, val){
    if(val == null) return null;
    var parser = client.parser.newParser(guild);
    var parsed = await parser.parse(type,val).catch(()=>{});
    return parsed;
}

module.exports = {
    name:"settings",
    description:"View settings\nguildid set as `*` makes the setting apply to every server, unless it's overwritten in it",
    group:"",
    examples:[],
    aliases:[],
    args:[],
    subcommands:[{
        name:"get",
        description:"Get values of setting",
        group:"",
        examples:["settings get base * cmd.ping.message"],
        aliases:[],
        args:[{
            type:"string",
            name:"module"
        },{
            type:"string",
            name:"guildId"
        },{
            type:"string",
            name:"key"
        }],
        ownerOnly:true,
        run:async ({client, msg, prefix, cmd, args})=>{
            if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
            if(args[1] == "this") args[1] = msg.guild.id;
            var fk = await client.settings.getKey(args[0], args[2]);
            if(fk == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid key", null, msg);
            if(fk.type == "role") {
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
                else if(fk.guildIdUsed !== false && args[1] == "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support `*` as the guild id due to it being per guild", null, msg);
            }
            else{
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
            }
            var embed = await new MessageEmbed()
                .setTitle("Value"+(fk.array ? "s" : "")+" for "+`${args[0]}/${args[2]}`)
                .addColor((msg.guild||msg.author).id);
            var values = await client.settings.get(...args);
            if(fk.array){
                var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
                for(var val of values){
                    var parsed = await parser.parse(fk.type, val.value);
                    val.value = parsed.display;
                }
                msg.channel.s("",
                    embed.setDescription("**Type:** "+fk.type+(fk.array?"[]":"")+"\n"+"__**Values:**__\n"+values.map(e=>"**ID:** "+e.id+"\n**Value:** "+escapeMarkdown(e.value)).join("\n-\n")),
                    msg
                )
            }
            else{
                var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
                var parsed = await parser.parse(fk.type, values.value);
                values.value = parsed.display;
                msg.channel.s("",
                    embed.setDescription("**Type:** "+fk.type+(fk.array?"[]":"")+"\n"+"**ID:** "+values.id+"\n**Value:** "+escapeMarkdown(values.value)),
                    msg
                )
            }
        }
    },{
        name:"delete",
        description:"Delete setting value entry",
        group:"",
        examples:[],
        aliases:[],
        args:[{
            type:"int",
            name:"id"
        }],
        ownerOnly:true,
        run:async ({client, msg, prefix, cmd, args})=>{
            if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
            var key = await client.database.get("SELECT `module`, `key` FROM setting WHERE `id`=?", [args[0]]);
            if(key == null) return await msg.channel.s(client.$.emoji.xmark+" Couldn't find anything to update", null, msg); 
            var fk = await client.settings.getKey(key.module, key.key);
            if(fk == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid key (Internal error, please report this)", null, msg);
            const affected = await client.settings.delete(...args);
            if(affected == 0) return await msg.channel.s(client.$.emoji.xmark+" Couldn't find anything to delete", null, msg); 
            else return await msg.channel.s(client.$.emoji.check+" Should be done!", null, msg); 
        }
    },{
        name:"update",
        description:"Update value of setting",
        group:"",
        examples:[],
        aliases:[],
        args:[{
            type:"int",
            name:"id"
        },{
            type:"string",
            name:"value"
        }],
        ownerOnly:true,
        run:async ({client, msg, prefix, cmd, args})=>{
            if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
            var key = await client.database.get("SELECT `module`, `key` FROM setting WHERE `id`=?", [args[0]]);
            if(key == null) return await msg.channel.s(client.$.emoji.xmark+" Couldn't find anything to update", null, msg); 
            var fk = await client.settings.getKey(key.module, key.key);
            if(fk == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid key (Internal error, please report this)", null, msg);
            var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
            var parsed = await parser.parse(fk.type, args[1]);
            if(parsed.value == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid argument provided for value", null, msg);
            args[1] = parsed.key;
            const affected = await client.settings.update(...args);
            if(affected == 0) return await msg.channel.s(client.$.emoji.xmark+" Couldn't find anything to update", null, msg); 
            else return await msg.channel.s(client.$.emoji.check+" Should be done!", null, msg); 
        }
    },{name:"add",redirect:"insert"},{
        name:"insert",
        description:"Insert value to an array setting",
        group:"",
        examples:[],
        aliases:[],
        args:[{
            type:"string",
            name:"module"
        },{
            type:"string",
            name:"guildId"
        },{
            type:"string",
            name:"key"
        },{
            type:"string",
            name:"value"
        }],
        ownerOnly:true,
        run:async ({client, msg, prefix, cmd, args})=>{
            if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
            if(args[1] == "this") args[1] = msg.guild.id;
            var fk = await client.settings.getKey(args[0], args[2]);
            if(fk == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid key", null, msg);
            if(fk.type == "role") {
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
                else if(fk.guildIdUsed !== false && args[1] == "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support `*` as the guild id due to it being per guild", null, msg);
            }
            else{
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
            }
            var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
            var parsed = await parser.parse(fk.type, args[3]).catch(e=>e);
            if(parsed.value == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid argument provided for value ("+parsed+")", null, msg);
            args[3] = parsed.key;
            const affected = await client.settings.insert(...args);
            if(affected == 0) return await msg.channel.s(client.$.emoji.xmark+" Failed to insert value", null, msg); 
            else return await msg.channel.s(client.$.emoji.check+" Should be done!", null, msg);
        }
    },{
        name:"set",
        description:"Set value of non array setting",
        group:"",
        examples:[],
        aliases:[],
        args:[{
            type:"string",
            name:"module"
        },{
            type:"string",
            name:"guildId"
        },{
            type:"string",
            name:"key"
        },{
            type:"string",
            name:"value"
        }],
        ownerOnly:true,
        run:async ({client, msg, prefix, cmd, args})=>{
            if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
            if(args[1] == "this") args[1] = msg.guild.id;
            var fk = await client.settings.getKey(args[0], args[2]);
            if(fk == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid key (Internal error, please report this)", null, msg);
            if(fk.array == true) return await msg.channel.s(client.$.emoji.xmark+" This setting supports multiple values, and should be modified using `add/insert` and `delete`", null, msg);
            if(fk.type == "role") {
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
                else if(fk.guildIdUsed !== false && args[1] == "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support `*` as the guild id due to it being per guild", null, msg);
            }
            else{
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
            }
            var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
            var parsed = await parser.parse(fk.type, args[3]);
            if(parsed.value == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid argument provided for value", null, msg);
            args[3] = parsed.key;
            const affected = await client.settings.set(...args);
            if(affected == 0) return await msg.channel.s(client.$.emoji.xmark+" Failed to set value", null, msg); 
            else return await msg.channel.s(client.$.emoji.check+" Should be done!", null, msg);
        }
    },{
        name:"unset",
        description:"Unset value of non array setting",
        group:"",
        examples:[],
        aliases:[],
        args:[{
            type:"string",
            name:"module"
        },{
            type:"string",
            name:"guildId"
        },{
            type:"string",
            name:"key"
        }],
        ownerOnly:true,
        run:async ({client, msg, prefix, cmd, args})=>{
            if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
            if(args[1] == "this") args[1] = msg.guild.id;
            var fk = await client.settings.getKey(args[0], args[2]);
            if(fk == null) return await msg.channel.s(client.$.emoji.xmark+" Invalid key (Internal error, please report this)", null, msg);
            if(fk.type == "role") {
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
                else if(fk.guildIdUsed !== false && args[1] == "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support `*` as the guild id due to it being per guild", null, msg);
            }
            else{
                if(fk.guildIdUsed === false && args[1] != "*") return await msg.channel.s(client.$.emoji.xmark+" This setting does not support guild ids other than `*` due to it being global", null, msg);
            }
            //var parser = client.parser.newParser(msg.guild, msg.author, msg.channel);
            //var parsed = await parser.parse(fk.type, args[3]);
            //if(parsed.value == null) return await msg.channel.send(client.$.emoji.xmark+" Invalid argument provided for value", null, msg);
            const affected = await client.settings.deleteKey(...args);
            if(affected == 0) return await msg.channel.s(client.$.emoji.xmark+" Failed to unset value", null, msg); 
            else return await msg.channel.s(client.$.emoji.check+" Should be done!", null, msg);
        }
    },{
        name:"export-raw",
        description:"Export all settings to pastebin.com",
        group:"",
        examples:[],
        aliases:[],
        args:[],
        ownerOnly:true,
        guildOnly:true,
        cooldown: 10,
        canRunArgs: (ctx)=>{
            if(!paste.isPasteAvailable()) return "Exporting data to PasteBin is not set up, please set a token in config.json";
        },
        run:async ({client, msg})=>{
            var allSetts = [];
            for(var m of client._modules){
                for(var set of m.settings){
                    var curr = await client.settings.getAll(m.id, set.name);
                    if(curr == null) continue;
                    for(var e of curr){
                        let p = await getParsedRaw(client, msg.guild, set.type, e.value);
                        allSetts.push({id:e.id, module:m.id, guildid:e.guildid, key:set.name, type:set.type+(set.array?"[]":""), value:e.value, parsedKey:p?.key, parsedValue:p?.value, parsedDisplay:p?.display})
                    }
                }
            }

            await msg.channel.s(await paste.uploadTable("settings export-raw", allSetts) || client.$.emoji.xmark+" Failed to generate paste URL...", null, msg);
        }
    }],
    ownerOnly:true,
    run:async ({client, msg, prefix, cmd, args})=>{
        if(!client._config.owners.includes(msg.author.id)) return await msg.channel.s(client.$.emoji.xmark+" This command can only be used by my owners", null, msg);
        var embed = await new MessageEmbed()
            .addColor((msg.guild||msg.author).id);
        for(var m of client._modules){
            var allSetts = [];
            for(var set of m.settings){
                var curr = await client.settings.get(m.id, (msg.guild||msg.author).id, set.name);
                if(curr == null) continue;
                if(curr.length === 0) continue;
                if(curr.length != null) {
                    for(var e of curr){
                        e.value = await getParsedVal(client, msg.guild, set.type, e.value);
                    }
                }
                else curr.value = await getParsedVal(client, msg.guild, set.type, curr.value);
                allSetts.push({value:curr, key:set.name});
            }
            if(m.settings != null && (m.settings||[]).length > 0) embed.addField(`${m.name} (${m.id})`, m.settings.map(e=>{
                var curr = allSetts.find(se=>se.key==e.name);
                var currmeta = client.settings.getKey(m.id, e.name);
                var icon = currmeta.guildIdUsed === false ? "🌐" : "▶";
                if(curr != null){
                    curr = curr.value;
                    //var def = curr.length != null ? curr[0].id == "default" : curr.id == "default";
                    return icon+" `"+e.name+"`: "+e.type+(e.array?"[]":"")+`${curr.length != null ? " - "+curr.length+" values" : ""}`
                } else return icon+" `"+e.name+"`: "+e.type+(e.array?"[]":"")+` - Value not set`;
            }).join("\n"))
            else embed.addField(`${m.name} (${m.id})`, "*No settings*");
        }
        embed.addField("Legend", "▶ - Can be configured globally and also overriden any server/user id\n🌐 - Can be set globally (`* as guildid`) only, no overriding in specific servers")
        msg.channel.s("Here is a list of valid settings", embed, msg);
    }
}