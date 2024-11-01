const paste = require('../../../paste');
module.exports = {
    name:"economy-commands",
    description:"",
    group:"Command managment",
    examples:[],
    aliases:["economy-cc"],
    args:[],
//    canRun:"economycustom::manager",
    subcommands:[{
        name:"create",
        description:"Use :id to create commands for certain roles",
        group:"",
        examples:["create work"],
        aliases:[],
        args:[{
            type:"string",
            name:"name"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            if(!/^[a-z0-9-]{2,32}(:([0-9]{17,19}))?$/.test(ctx.args[0])) return "Invalid command name";
            if((await ctx.client.database.get("SELECT 1 FROM commands WHERE `name` = ?", [ctx.args[0]])) != null) return "Command already exists";
        },
        run:async (ctx)=>{
            let cmddata = {
                type:1,
                name:ctx.args[0],
                successChance:0.5,
                cooldown:24*60*60,
                outcomeBorder:0,
                enabled:false,
                showInIndex:true,
                failminPayout:0,
                failmaxPayout:0,
                successminPayout:0,
                successmaxPayout:0,
                message:"",
            };
            await ctx.client.database.run("INSERT INTO commands (`type`, `name`, `successChance`, `cooldown`, `outcomeBorder`, `enabled`, `showInIndex`, `failminPayout`, `failmaxPayout`, `successminPayout`, `successmaxPayout`, `message`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                [cmddata.type, cmddata.name, cmddata.successChance, cmddata.cooldown, cmddata.outcomeBorder, cmddata.enabled, cmddata.showInIndex, cmddata.failminPayout, cmddata.failmaxPayout, cmddata.successminPayout, cmddata.successmaxPayout, cmddata.message]
            );
            ctx.msg.channel.s(ctx.$.emoji.check+" Command added", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command created", "00FF00", cmddata, null)
        }
    },{
        name:"create-deny",
        description:"Create a deny message for commands that can't be ran without a role",
        group:"",
        examples:["create-deny vip You aren't vip enough to run this command"],
        aliases:[],
        args:[{
            type:"string",
            name:"name"
        },{
            type:"string",
            name:"message"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            if(!/^[a-z0-9-]{2,32}(:([0-9]{17,19}))?$/.test(ctx.args[0])) return "Invalid command name";
            if((await ctx.client.database.get("SELECT 1 FROM commands WHERE `name` = ?", [ctx.args[0]])) != null) return "Command already exists";
        },
        run:async (ctx)=>{
            let cmddata = {
                type:2,
                name:ctx.args[0],
                enabled:true,
                showInIndex:true,
                message:ctx.args[1],
                successChance: 0,
                failminPayout:0,
                failmaxPayout:0,
                successminPayout:0,
                successmaxPayout:0,
                cooldown:0,
                outcomeBorder:0,
            };
            await ctx.client.database.run("INSERT INTO commands (`type`, `name`, `successChance`, `cooldown`, `outcomeBorder`, `enabled`, `showInIndex`, `failminPayout`, `failmaxPayout`, `successminPayout`, `successmaxPayout`, `message`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                [cmddata.type, cmddata.name, cmddata.successChance, cmddata.cooldown, cmddata.outcomeBorder, cmddata.enabled, cmddata.showInIndex, cmddata.failminPayout, cmddata.failmaxPayout, cmddata.successminPayout, cmddata.successmaxPayout, cmddata.message]
            );
            ctx.msg.channel.s(ctx.$.emoji.check+" Command added", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command created", "00FF00", cmddata, null)
        }
    },{
        name:"delete",
        description:"**WARNING:** This will irreversibly delete all replies connected to this command",
        group:"",
        examples:["delete mistake"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            if((await ctx.client.database.get("SELECT 1 FROM commands WHERE `name` = ?", [ctx.args[0]])) == null) return "Command doesn't exist";
        },
        run:async (ctx)=>{
            const r = await ctx.msg.confirm(ctx.msg.author.id, "delete the `"+ctx.args[0]+"` command").catch(()=>{});
            if(!r) return ctx.msg.channel.s(ctx.$.emoji.xmark+" Cancelled", null, ctx.msg);
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("DELETE FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("DELETE FROM replies WHERE `command` = ?", [ctx.args[0]]);
            await ctx.msg.channel.s(ctx.$.emoji.check+" Command deleted", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command deleted", "FF0000", cmd, null)
        }
    },{
        name:"rename",
        description:"Warning!! This will not keep cooldowns",
        group:"",
        examples:["rename wokr work"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"string",
            name:"newname"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            if((await ctx.client.database.get("SELECT 1 FROM commands WHERE `name` = ?", [ctx.args[0]])) == null) return "Command doesn't exist";
            if(!/^[a-z0-9-]{2,32}(:([0-9]{17,19}))?$/.test(ctx.args[1])) return "Invalid new name";
            if((await ctx.client.database.get("SELECT 1 FROM commands WHERE `name` = ?", [ctx.args[1]])) != null) return "New name is already taken";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `name` = ? WHERE `name` = ?", [ctx.args[1], ctx.args[0]]);
            await ctx.client.database.run("UPDATE replies SET `command` = ? WHERE `command` = ?", [ctx.args[1], ctx.args[0]]);
            await ctx.msg.channel.s(ctx.$.emoji.check+" Command renamed", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command renamed", "FFFF00", cmd, {...cmd, name:ctx.args[1]});
        }
    },{
        name:"set-cooldown",
        description:"",
        group:"",
        examples:["set-cooldown work 1d"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"timespan",
            name:"timespan"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `cooldown` = ? WHERE `name` = ?", [ctx.args[1].totalSeconds(), ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command updated", "FFFF00", cmd, {...cmd, cooldown:ctx.args[1].totalSeconds()});
        }
    },{
        name:"set-successrate",
        description:"",
        group:"",
        examples:["set-successrate work 100","set-successrate crime 50"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"int",
            name:"successrate"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
            if(ctx.args[1] < 0 || ctx.args[1] > 100) return "Invalid success rate"
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `successChance` = ? WHERE `name` = ?", [ctx.args[1] / 100, ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command updated", "FFFF00", cmd, {...cmd, successChance:ctx.args[1] / 100});
        }
    },{
        name:"set-outcomeborder",
        description:"Decides what the bot considers a success and what it considers a fail, doesn't affect reply picking and the success chance",
        group:"",
        examples:["set-outcomeborder work 0","set-outcomeborder risky-crime 100"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"int",
            name:"outcomeborder"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `outcomeBorder` = ? WHERE `name` = ?", [ctx.args[1], ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command updated", "FFFF00", cmd, {...cmd, outcomeBorder:ctx.args[1]});
        }
    },{
        name:"set-message",
        description:"Set deny message of command",
        group:"",
        examples:["set-message work You must get a job before running this command"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"string",
            name:"message"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 2) return "This isn't a deny command";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `message` = ? WHERE `name` = ?", [ctx.args[1], ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command updated", "FFFF00", cmd, {...cmd, message:ctx.args[1]});
        }
    },{
        name:"enable",
        description:"",
        group:"",
        examples:["enable work"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type`, `enabled` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
            if(cmd.enabled) return "Command already enabled";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `enabled` = ? WHERE `name` = ?", [true, ctx.args[0]]);
            await ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command enabled", "FFFF00", cmd, {...cmd, enabled:true});
        }
    },{
        name:"disable",
        description:"",
        group:"",
        examples:["disable work"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type`, `enabled` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
            if(!cmd.enabled) return "Command already disabled";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `enabled` = ? WHERE `name` = ?", [false, ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command disabled", "FFFF00", cmd, {...cmd, enabled:false});
        }
    },{
        name:"set-payout",
        description:"",
        group:"",
        examples:["set-payout work fail min 100"],
        aliases:[],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"choice",
            name:"replytype",
            parserArgs:{
                choices:["fail", "success"].map(e=>({key:e,value:e}))
            }
        },{
            type:"choice",
            name:"minmax",
            parserArgs:{
                choices:["min", "max"].map(e=>({key:e,value:e}))
            }
        },{
            type:"int",
            name:"payout"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT `type` FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
            if(cmd.type != 1 && cmd.type != 3) return "This isn't a regular command or an alias";
            if(ctx.args[1] == "fail" && ctx.args[3] > 0) return "Invalid payout, it doesn't make sense...";
            if(ctx.args[1] == "success" && ctx.args[3] < 0) return "Invalid payout, it doesn't make sense...";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            const fieldName = ctx.args[1]+ctx.args[2]+"Payout";
            if(!["fail", "success"].includes(ctx.args[1]) || !["min", "max"].includes(ctx.args[2])) return
            await ctx.client.database.run("UPDATE commands SET `"+fieldName+"` = ? WHERE `name` = ?", [ctx.args[3], ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command updated", "FFFF00", cmd, {...cmd, [fieldName]: ctx.args[3]});
        }
    },{
        name:"set-showinindex",
        description:"",
        group:"",
        examples:["set-showinindex work true"],
        aliases:["set-indexvisible"],
        args:[{
            type:"string",
            name:"command"
        },{
            type:"bool",
            name:"value"
        }],
        canRun:"economycustom::manager",
        canRunArgs:async (ctx)=>{
            let cmd = await ctx.client.database.get("SELECT 1 FROM commands WHERE `name` = ?", [ctx.args[0]]);
            if(cmd == null) return "Command doesn't exist";
        },
        run:async (ctx)=>{
            const cmd = await ctx.client.database.get("SELECT * FROM commands WHERE `name` = ?", [ctx.args[0]]);
            await ctx.client.database.run("UPDATE commands SET `showInIndex` = ? WHERE `name` = ?", [ctx.args[1], ctx.args[0]]);
            ctx.msg.channel.s(ctx.$.emoji.check+" Command updated", null, ctx.msg);
            await ctx.client.$.economycustom.log(ctx.msg.author, "Command updated", "FFFF00", cmd, {...cmd, showInIndex: ctx.args[1]});
        }
    },{
        name:"export",
        description:"Export all commands to pastebin",
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
                type,name,enabled,showInIndex,successChance,cooldown,outcomeBorder,successminPayout,successmaxPayout,failminPayout,failmaxPayout,message
                FROM commands`,
                []
            );

            await ctx.msg.channel.s(await paste.uploadTable("economy-cc export", cmds) || ctx.client.$.emoji.xmark+" Failed to generate paste URL...", null, ctx.msg);
        }
    },{
        name:"list",
        description:"List all command names",
        group:"",
        examples:[],
        aliases:[],
        args:[],
        canRun:"economycustom::manager",
        run:async (ctx)=>{
            const cmds = await ctx.client.database.all("SELECT `name`, `type` FROM commands", []);
            var msg = cmds.map(e=>e.name+" ["+e.type+"]").sort((a,b)=>{
                if(a.split(":")[0] == b.split(":")[0]){
                    if(a.split(":")[1] == null) return -1;
                    if(b.split(":")[1] == null) return 1;
                    return a.split(":")[1].localeCompare(b.split(":")[1]);
                }
                return a.split(":")[0].localeCompare(b.split(":")[0]);
            });
            if(msg == "") msg = "*No commands*";
            ctx.msg.channel.s(msg, null, ctx.msg);
        }
    }],
    run:async (ctx)=>{
        ctx.client.processCommand(ctx.msg, "help "+ctx.cmdname);
    }
}