const Discord = require("discord.js");
module.exports = {
    version:"1",
    name:"modules",
    group:"",
    description:"List all modules",
    aliases:[],
    args:[],
    hidden:true,
    run:async (ctx)=>{
        var embed = await new Discord.MessageEmbed()
            .addAuthor(ctx.msg.author)
            .setTitle("Modules")
            .addColor((ctx.msg.guild||ctx.msg.author).id)
        var builder = "";
        for(var m of ctx.client._modules){
            builder += `**${m.name} (${m.id})** - ${m.author}\n`;
        }
        embed.setDescription(builder);
        ctx.msg.channel.s(``, embed, ctx.msg)
    }
}