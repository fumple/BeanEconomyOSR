const { MessageEmbed } = require("discord.js");

module.exports = {
    name:"index",
    description:"",
    group:"",
    examples:[],
    aliases:["cmds"],
    args:[],
    shortPrefix:true, //Botch, to prevent conflicts
    run:async (ctx)=>{
        var legend = await new MessageEmbed()
                        .setTitle("Legend")
                        .setDescription(`${ctx.client.$.emoji.online} You can run this command\n${ctx.client.$.emoji.idle} You can't run this command because of a cooldown\n${ctx.client.$.emoji.dnd} You can't run this command`)
                        .addColor(ctx.msg.guild.id)

        var finalList = [];
        var _cmds = await ctx.client.database.all("SELECT * FROM commands WHERE `enabled` = ? AND `showInIndex` != ?", [true, false]);
        var _rpls = await ctx.client.database.all("SELECT * FROM replies WHERE `enabled` = ?", [true]);
        var roles = [...ctx.msg.member.roles.cache.values()];
        for(var cmd of _cmds.filter(e=>!e.name.includes(":"))){
            var subcmds = _cmds
                .filter(e=>e.name.startsWith(cmd.name+":"))
                .map(e=>e.name.split(":"))
                .filter(e=>roles.find(r=>r.id==e[1]))
                .sort((a,b)=>roles.find(e=>e.id==a[1]).comparePositionTo(roles.find(e=>e.id==b[1]))*-1);

            var topcmd = cmd;
            if(subcmds.length > 0) topcmd = _cmds.find(e=>e.name==subcmds[0].join(":"));
            if(topcmd.type == 2) {
                finalList.push({sort:2,value:ctx.client.$.emoji.dnd+" **"+ctx.prefix+cmd.name+"**"});
                continue;
            }
            var replies = _rpls.filter(e=>e.command == topcmd.name || (topcmd.target != null && e.command == topcmd.target));
            if(replies.length == 0) continue;

            var sort = 0;
            //Cooldown
            const cooldown = await ctx.client.database.cooldown("economycustom::cc-"+topcmd.name, ctx.msg.guild.id, ctx.msg.author.id); //"*"
            var cooldownmsg = "";
            if(cooldown != null){
                sort = 1;
                var diff = cooldown - new Date();
                var remaining = diff / 1000;
                if(remaining > 0){
                    var seconds = Math.floor(remaining % 60);
                    var minutes = Math.floor(remaining / 60) % 60;
                    var hours = Math.floor(Math.floor(remaining / 60) / 60) % 24;
                    var days = Math.floor(Math.floor(Math.floor(remaining / 60) / 60) / 24);
                    cooldownmsg = "- "+(days != 0 ? (days != 1 ? days+" days, " : days+" day, ") : "")+
                    (hours != 0 ? (hours != 1 ? hours+" hours, " : hours+" hour, ") : "")+
                    (minutes != 0 ? (minutes != 1 ? minutes+" minutes and " : minutes+" minute and ") : "")+
                    (seconds != 1 ? seconds+" seconds" : seconds+" second");
                }
            }

            finalList.push({sort:sort,sort2:cooldown,value:(cooldown != null ? ctx.client.$.emoji.idle : ctx.client.$.emoji.online)+" **"+ctx.prefix+cmd.name+"**"/*+(topcmd.name.split(":").length > 1 ? " ("+topcmd.name.split(":")[1]+")" : "")*/+" "+cooldownmsg});
        }
        finalList = finalList.sort((a,b)=>{
            if(a.sort == b.sort){
                if(a.sort2 == null) return a.value.localeCompare(b.value);
                else return a.sort2 - b.sort2;
            }
            return a.sort - b.sort;
        }).map(e=>e.value).join("\n");
        ctx.msg.channel.s(finalList, legend, ctx.msg);
    }
}