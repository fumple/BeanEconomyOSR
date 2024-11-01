const { MessageEmbed } = require("discord.js")

module.exports = {
    name:"purge-cooldowns",
    description:`Purge cooldowns based on filters.
All of the below filters are optional, multiple of them can be used at once.
--user (-u): Only purge this user's cooldown
--guild (-g): Only purge cooldowns from this guild
--cmd (-c): Only purge cooldowns of commands matching this string using MySQL wildcards (Example: purge weekly command: \`%cc-weekly%\`)`,
    group:"",
    examples:[],
    aliases:["purge-cd"],
    args:[],
    nargs:{
        "--user":{
            type: "user",
            ntype: String,
            name: "user",
            default: null
        },
        "-u":{
            ntype:"--user"
        },

        "--guild":{
            type: "user",
            ntype: String,
            name: "user",
            default: null
        },
        "-g":{
            ntype:"--guild"
        },

        "--cmd":{
            type: "string",
            ntype: String,
            name: "command name",
            default: null
        },
        "-c":{
            ntype:"--cmd"
        }
    },
    ownerOnly: true,
    canRunArgs: async ctx=>{
        if((ctx.nargs["--cmd"] || "").includes("'")) return "CMD filter can't contain the `'` character"
    },
    run:async ctx=>{
        const user = ctx.nargs["--user"];
        const guild = ctx.nargs["--guild"];
        const cmd = ctx.nargs["--cmd"] != null ? ctx.nargs["--cmd"] : null;
        if(await ctx.msg.confirm(ctx.msg.author.id, "purge the cooldowns\n"+
            (user != null ? "of <@"+user.id+">" : "of any user")+"\n"+
            (guild != null ? "in "+guild.name : "in any guild")+"\n"+
            (cmd != null ? "with command names matching "+cmd : "with any command name")
        ).catch(()=>{})) {
            const affected = (await ctx.client.database.run("DELETE FROM cooldown"+
                ([user, guild, cmd].some(e=>e!=null) ? (' WHERE '+
                    [
                        (user != null ? '`userid` = ?' : ''),
                        (guild != null ? 'guildid` = ?' : ''),
                        (cmd != null ? '`commandname` LIKE ?' : '')
                    ].filter(e=>e!='').join(" AND ")
                ): ''), [user, guild, cmd].filter(e=>e!=null).map(e=>e.id || e)
            ).catch(console.error)) || 0
            await ctx.msg.channel.s("Deleted "+affected+" cooldowns", null, ctx.msg)
        }
    }
}