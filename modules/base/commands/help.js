const Discord = require("discord.js");
module.exports = {
    version:"1",
    name:"help",
    group:"",
    description:"Get help",
    usage:"help (command) (subcommand)",
    aliases:[],
    args:[{
        type:"string",
        name:"command",
        default:""
    },{
        type:"string",
        name:"subcommand",
        default:null
    }],
    hidden:true,
    run:async ({client, msg, prefix, cmdname:sentcmd, args})=>{
        var embed = await new Discord.MessageEmbed()
            .addColor((msg.guild||msg.author).id);
        if(args[0] == ""){
            var cmdsbymodule = {};
            embed = embed
                .setTitle("Help")
                .setDescription(`Here is a list of my commands:
To get more help about a command, send **${prefix}${sentcmd} [command name]**`);
            for(var foundcmd of client._commands){
                if((foundcmd.module == "debug" || foundcmd.debug) && !client._config.owners.includes(msg.author.id)) continue;
                if(foundcmd.superUserOnly && !client._config.superUsers.includes(msg.author.id)) continue;
                if(foundcmd.ownerOnly && !client._config.owners.includes(msg.author.id)) continue;
                var cmdname = foundcmd.name;
                if(foundcmd.redirect != null) continue;
                if(foundcmd.hidden || foundcmd.group == null) continue;
                if(cmdsbymodule[foundcmd.module] == null) cmdsbymodule[foundcmd.module] = [foundcmd];
                else cmdsbymodule[foundcmd.module] = cmdsbymodule[foundcmd.module].concat(foundcmd);
            }
            for(var cmdmodule in cmdsbymodule){
                var cmdsbygroup = {};
                for(var foundcmd of cmdsbymodule[cmdmodule]){
                    if(cmdsbygroup[foundcmd.group] == null) cmdsbygroup[foundcmd.group] = [foundcmd];
                    else cmdsbygroup[foundcmd.group] = cmdsbygroup[foundcmd.group].concat(foundcmd);
                }
                var final = Object.entries(cmdsbygroup).sort((a,b)=>a[0]>b[0])
                    .map(e=>{
                        if(e[0] == "") return e[1].map(cmd=>cmd.name).join(", ");
                        else return "**"+e[0]+"**\n"+e[1].map(cmd=>cmd.name).join(", ");
                    }).join("\n\n");
                embed.addField(client._modules.find(e=>e.id==cmdmodule).name+" ("+cmdmodule+")", final)
            }
            await msg.channel.s("", embed, msg);
        }
        else{
            embed = embed
                .setTitle(sub ? "Help for "+args[0]+" "+args[1] : "Help for "+args[0]);
            var cmd = client.findCommands(args[0], args[1])[0];
            if(cmd == null) return await msg.channel.s("", embed
                .setDescription(args[1] != null ? "Command "+args[0]+" "+args[1]+" not found" : "Command "+args[0]+" not found")
                .setColor("RED"), msg);
            var {parent,sub,cmd} = cmd;

            var description = `__**${sub ? parent.name : ""} ${cmd.name}**__`;
            description += "\n"+(cmd.description||"*This command doesn't have a description... sad :(\nfigure it out yourself*");
            description += `\n**Usage:** ${sub ? parent.name : ""} ${cmd.name} ${cmd.args.map(a=>a.default === undefined ? "["+a.name+"]" : "("+a.name+")").join(" ")}`
            if(cmd.examples != null) if(cmd.examples.length > 0) 
                description += "\n**Examples:**\n"+cmd.examples.map(e=>'- `'+e+'`').join("\n");
            if(cmd.aliases != null) if(cmd.aliases.length > 0)
                description += "\n**Aliases:** "+cmd.aliases.join(", ");
            if(cmd.subcommands != null) if(cmd.subcommands.length > 0)
                description += "\n**Subcommands:**\n"+cmd.subcommands.filter(e=>e.redirect==null).map(e=>'- `'+`${e.name}${e.args.length>0?(" "+e.args.map(a=>a.default === undefined ? "["+a.name+"]" : "("+a.name+")").join(" ")):""}`+'` - '+(e.description||"*no description*")).join("\n");
            if(typeof cmd.canRun == "string")
                description += `\n**Required role:** ${cmd.canRun}`

            embed = embed
                .setDescription(description);
            await msg.channel.s("", embed, msg);
        }
    }
}