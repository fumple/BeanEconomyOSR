const { Client, MessageEmbed, GuildChannel } = require("discord.js");
const fs = require("fs");
const path = require('path');

const _moduleID = path.basename(__dirname);
const commandWorker = require(__dirname+"/commandWorker");

/** 
 * Register module
 * @param {Client} client - Discord
 * @param {Command[]} commands - Commands to register
 * @param {APIEndpoint[]} apiEndpoints - API Endpoints to register
 */
async function register(client, commands, apiEndpoints){
    client.$.economycustom = {};
    client.$.economycustom.run = (cmdname, msg, debug = false)=>{
        var allRoles = [];
        for(var g of client.guilds.cache.values()){
            var m = g.members.resolve(msg.author.id);
            if(m == null) continue;
            allRoles.push(...m.roles.cache.values());
        }
        commandWorker.run({
            client,
            $:client.$,
            allRoles,
            msg,
            cmdname,
            debug
        });
    };
    client.$.economycustom.topcmds = async (user) => {
        var finalList = [];
        var _cmds = await client.database.all("SELECT * FROM commands WHERE `enabled` = ? AND `showInIndex` != ?", [true, false]);
        var _rpls = await client.database.all("SELECT * FROM replies WHERE `enabled` = ?", [true]);
        var roles = [...user.roles.cache.values()];
        for(var cmd of _cmds.filter(e=>!e.name.includes(":"))){
            var subcmds = _cmds
                .filter(e=>e.name.startsWith(cmd.name+":"))
                .map(e=>e.name.split(":"))
                .filter(e=>roles.find(r=>r.id==e[1]))
                .sort((a,b)=>roles.find(e=>e.id==a[1]).comparePositionTo(roles.find(e=>e.id==b[1]))*-1);

            var topcmd = cmd;
            if(subcmds.length > 0) topcmd = _cmds.find(e=>e.name==subcmds[0].join(":"));
            if(topcmd.type == 2) continue;

            var replies = _rpls.filter(e=>e.command == topcmd.name || (topcmd.target != null && e.command == topcmd.target));
            if(replies.length == 0) continue;

            finalList.push(topcmd.name);
        }
        return finalList;
    }
    client.$.economycustom.log = async (user, title, hex, data, dataUpdated) => {
        let channelId = await client.settings.get("economycustom", "*", "log").catch(()=>{});
        if(channelId?.value == null) return;
        /**
         * @type {GuildChannel}
         */
        let channel = await client.channels.fetch(channelId.value).catch(()=>{});
        if(channel == null) return;
        if(!channel.isText()) return;
        var fields = Object.entries(data).flatMap(e => {
            if(dataUpdated != null) {
                if(dataUpdated[e[0]] != undefined && dataUpdated[e[0]] != e[1]) {
                    return [{
                        name: e[0],
                        value: JSON.stringify(e[1], null, 2),
                        inline: true
                    },{
                        name: "->",
                        value: JSON.stringify(dataUpdated[e[0]], null, 2),
                        inline: true
                    }]
                } else {
                    return [{
                        name: e[0],
                        value: JSON.stringify(e[1], null, 2),
                        inline: false
                    }];
                }
            } else {
                return [{
                    name: e[0],
                    value: JSON.stringify(e[1], null, 2),
                    inline: true
                }]
            }
        });
        if(dataUpdated != null && fields.findIndex(e => e.name == "->") == -1) return;
        await channel.s(user, {
            title,
            color: parseInt(hex, 16),
            fields
        }, null, {
            allowedMentions: {
                users: []
            }
        }).catch(console.error)
    }
    for(var f of fs.readdirSync(__dirname+"/commands")){
        console.log(f,__dirname+"/commands/"+f);
        commands.push(require(__dirname+"/commands/"+f))
    }
    var cooldownExpireCheck = setTimeout(()=>client.database.deleteexpiredcooldowns(), 10000)
    client.database.on('expiredCooldowns', async cds=>{
        clearTimeout(cooldownExpireCheck)

        try {
            let topcmdscache = {};
            let users = await client.settings.getAll(_moduleID, "notifusers");

            // This whole thing assumes that there is no more than one cd on an user, in practice more than one cd on the same command is not possible.
            for(let cd of cds) {
                if(!cd.commandname.startsWith("economycustom::cc-")) continue;
                if(users.find(e=>e.value == cd.userid && e.guildid == cd.guildid) == null) continue;

                let cmdname = cd.commandname.substr(18);
                let parentname = cmdname.split(":")[0];
                
                let guild = await client.guilds.fetch(cd.guildid);
                if(guild == null) continue;
                
                let member = await guild.members.fetch(cd.userid);
                if(member == null) continue;

                if(topcmdscache[cd.userid] == null) topcmdscache[cd.userid] = await client.$.economycustom.topcmds(member);
                if(topcmdscache[cd.userid].includes(cmdname)) {
                    let embed = await new MessageEmbed()
                        .setTitle("🔔 You can run a command again")
                        .setDescription("You can run **!"+parentname+"** again as of <t:"+Math.round(new Date(client._config.database.type == "mysql" ? cd.endsat : cd.endsat*1000).getTime()/1000)+":R>")
                        .addColor(cd.guildid);
                    let lastran = await client.database.lastran(cd.guildid, cd.userid, parentname).catch(()=>null);
                    if(lastran != null) {
                        lastran = lastran.split('/')
                        let channel = guild.channels.resolve(lastran[0]);
                        if(channel != null) {
                            let msg = await client.api.channels[lastran[0]].messages.post({data:{
                                content: "<@"+cd.userid+">",
                                embed:embed.toJSON(),
                                message_reference: {
                                    fail_if_not_exists: false,
                                    guild_id: cd.guildid,
                                    message_id: lastran[1]
                                },
                                components: [{
                                    type:1,
                                    components: [{
                                        type: 2,
                                        label: "!"+parentname,
                                        custom_id: '?'+parentname,
                                        style: 1
                                    }]
                                }]
                            }}).catch(()=>"f");
                            if(msg != "f") continue;
                        }
                    } 
                    member.send(embed
                        .setURL("https://discord.com/channels/"+cd.guildid))
                }
            }
        } catch (e) {
            console.error("notifsloop", e)
        }

        cooldownExpireCheck = setTimeout(()=>client.database.deleteexpiredcooldowns(), 10000)
    })
}

module.exports = {
    name:"Economy Custom",
    author:"@fumple",
    dependencies:["economy"],
    settings:[{
        type:"role",
        name:"manager",
        default:[],
        array:true,
        guildIdUsed:false
    },{
        type:"role",
        name:"replycontributor",
        default:[],
        array:true,
        guildIdUsed:false
    },{
        type:"member",
        name:"notifusers",
        default:[],
        array:true,
        guildIdUsed:true
    },{
        type:"channel",
        name:"log",
        default:[],
        array:false,
        guildIdUsed:false
    }],
    register:register
}