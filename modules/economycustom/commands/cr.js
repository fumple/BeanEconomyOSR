const { MessageEmbed } = require("discord.js");

const paste = require("../../../paste");
module.exports = {
    name:"economy-replies",
    description:"",
    group:"Command managment",
    examples:[],
    aliases:["economy-r", "replies", "reply"],
    args:[],
    canRun:"economycustom::manager",
    subcommands:[{
        name:"create",
        description:"",
        group:"",
        examples:["create work success You worked, congrats on {amount}"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"choice",
            name:"type",
            parserArgs:{
                choices:["fail", "success"].map(e=>({key:e,value:e}))
            }
        },{
            type:"string",
            name:"reply"
        }],
        canRun:"economycustom::replycontributor",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
            ctx.isAlias = cmd.type == 3;
        },
        run:async (ctx)=>{
            const { mid } = await ctx.client.database.get("SELECT MAX(`id`) as mid FROM replies", []);
            let cmddata = {
                enabled:true,
                id: mid+1,
                command:ctx.args[0],
                type:ctx.args[1],
                content:ctx.args[2],
                author:ctx.msg.author.id,
                minPayout:null,
                maxPayout:null,
                cooldown:null
            };
            await ctx.client.database.run("INSERT INTO replies (`enabled`, `id`, `command`, `type`, `content`, `author`, `minPayout`, `maxPayout`, `cooldown`) VALUES (?,?,?,?,?,?,?,?,?)",
                [cmddata.enabled, cmddata.id, cmddata.command, cmddata.type, cmddata.content, cmddata.author, cmddata.minPayout, cmddata.maxPayout, cmddata.cooldown]
            );
            ctx.msg.channel.s(ctx.$.emoji.check+" Reply created with id "+cmddata.id, ctx.isAlias ? new MessageEmbed()
                .setColor("YELLOW")
                .setTitle("Heads up!")
                .setDescription("You have added a reply to an alias, this may cause unintended behaviour if you don't know how those work") : null, ctx.msg);

            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply created", "00FF00", cmddata, null);
        }
    },{
        name:"delete",
        description:"",
        group:"",
        examples:["delete 1"],
        aliases:[],
        args:[{
            type:"string",
            name:"replyid"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT 1 FROM replies WHERE `id` = ?", [ctx.args[0]]);
            if(rpl == null) return "Reply doesn't exist";
        },
        run:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT * FROM replies WHERE `id` = ?", [ctx.args[0]]);
            const r = await ctx.msg.confirm(ctx.msg.author.id, "delete the `"+ctx.args[0]+"` reply").catch(()=>{});
            if(!r) return ctx.msg.channel.s(ctx.$.emoji.xmark+" Cancelled", null, ctx.msg);
            await ctx.client.database.run("DELETE FROM replies WHERE `id` = ?", [ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Deleted", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply deleted", "FF0000", rpl, null);
        }
    },{
        name:"set-cooldown",
        description:"",
        group:"",
        examples:["set-cooldown 1 1d"],
        aliases:[],
        args:[{
            type:"string",
            name:"replyid"
        },{
            type:"timespan",
            name:"time"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT 1 FROM replies WHERE `id` = ?", [ctx.args[0]]);
            if(rpl == null) return "Reply doesn't exist";
        },
        run:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT * FROM replies WHERE `id` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE replies SET `cooldown` = ? WHERE `id` = ?", [ctx.args[1].totalSeconds(), ctx.args[0]])
            ctx.msg.channel.s(ctx.$.emoji.check+" Reply updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply updated", "FFFF00", rpl, {...rpl, cooldown: ctx.args[1].totalSeconds()});
        }
    },{
        name:"edit",
        description:"",
        group:"",
        examples:["edit 4 Something something fixed this line etc..."],
        aliases:[],
        args:[{
            type:"string",
            name:"replyid"
        },{
            type:"string",
            name:"reply"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT 1 FROM replies WHERE `id` = ?", [ctx.args[0]]);
            if(rpl == null) return "Reply doesn't exist";
        },
        run:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT * FROM replies WHERE `id` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE replies SET `content` = ? WHERE `id` = ?", [ctx.args[1], ctx.args[0]])
            ctx.msg.channel.s(ctx.$.emoji.check+" Reply updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply updated", "FFFF00", rpl, {...rpl, content: ctx.args[1]});
        }
    },{
        name:"enable",
        description:"",
        group:"",
        examples:["enable 1"],
        aliases:[],
        args:[{
            type:"string",
            name:"replyid"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT `enabled` FROM replies WHERE `id` = ?", [ctx.args[0]]);
            if(rpl == null) return "Reply doesn't exist";
            if(rpl.enabled) return "Reply already enabled";
        },
        run:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT * FROM replies WHERE `id` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE replies SET `enabled` = ? WHERE `id` = ?", [true, ctx.args[0]])
            ctx.msg.channel.s(ctx.$.emoji.check+" Reply updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply enabled", "FFFF00", rpl, {...rpl, enabled: true});
        }
    },{
        name:"disable",
        description:"",
        group:"",
        examples:["disable 1"],
        aliases:[],
        args:[{
            type:"string",
            name:"replyid"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT `enabled` FROM replies WHERE `id` = ?", [ctx.args[0]]);
            if(rpl == null) return "Reply doesn't exist";
            if(!rpl.enabled) return "Reply already disabled";
        },
        run:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT * FROM replies WHERE `id` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE replies SET `enabled` = ? WHERE `id` = ?", [false, ctx.args[0]])
            ctx.msg.channel.s(ctx.$.emoji.check+" Reply updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply disabled", "FFFF00", rpl, {...rpl, enabled: false});
        }
    },{
        name:"set-payout",
        description:"",
        group:"",
        examples:["set-payout 1 min 100"],
        aliases:[],
        args:[{
            type:"string",
            name:"replyid"
        },{
            type:"choice",
            name:"type",
            parserArgs:{
                choices:["min", "max"]
            }
        },{
            type:"int",
            name:"payout"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT `type` FROM replies WHERE `id` = ?", [ctx.args[0]]);
            if(rpl == null) return "Reply doesn't exist";
            if(rpl.type == "fail" && ctx.args[2] > 0) return "You can't give a positive outcome on a fail reply, what's your logic there????";
            if(rpl.type == "success" && ctx.args[2] < 0) return "You can't give a negative outcome on a success reply, what's your logic there????";
        },
        run:async (ctx)=>{
            let rpl = await ctx.client.database.get("SELECT * FROM replies WHERE `id` = ?", [ctx.args[0]]);
            await ctx.client.database.run(ctx.args[1] == "min" ?
                "UPDATE replies SET `minPayout` = ? WHERE `id` = ?" :
                "UPDATE replies SET `maxPayout` = ? WHERE `id` = ?", [ctx.args[2], ctx.args[0]])
            ctx.msg.channel.s(ctx.$.emoji.check+" Reply updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Reply updated", "FFFF00", rpl, {...rpl, [ctx.args[1]+"Payout"]: ctx.args[2]});
        }
    },{
        name:"export",
        description:"Export all replies to fumple.pl/paste",
        group:"",
        examples:[],
        aliases:[],
        args:[],
        canRun:"economycustom::manager",
        cooldown: 10,
        canRunArgs: (ctx)=>{
            if(!paste.isPasteAvailable()) return "Exporting data to PasteBin is not set up, please set a token in config.json";
        },
        run:async (ctx)=>{
            const cmds = await ctx.client.database.all(`SELECT
                id,enabled,command,type,content,author,cooldown,minPayout,maxPayout
                FROM replies`,
                []
            );

            await ctx.msg.channel.s(await paste.uploadTable("economy-r export", cmds) || ctx.client.$.emoji.xmark+" Failed to generate paste URL...", null, ctx.msg);
        }
    },{
        name:"counts",
        description:"Counts replies by command",
        group:"",
        examples:[],
        aliases:[],
        args:[],
        canRun:"economycustom::manager",
        run:async (ctx)=>{
            const rpl = await ctx.client.database.all("SELECT `command` FROM replies", []);
            var msg = Object.entries(rpl.reduce((pv,v)=>{
                if(pv[v.command] == null) pv[v.command] = 0;
                pv[v.command] += 1;
                return pv;
            }, {})).sort((a,b)=>{
                return a[0].split(":")[0].localeCompare(b[0].split(":")[0]);
            }).map(e=>e[0]+" "+e[1]);
            if(msg == "") msg = "*No replies*";
            ctx.msg.channel.s(msg, null, ctx.msg);
        }
    }],
    run:async (ctx)=>{
        ctx.client.processCommand(ctx.msg, "help "+ctx.cmdname);
    }
}
