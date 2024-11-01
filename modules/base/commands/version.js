const { MessageEmbed } = require('discord.js');

module.exports = {
    name:"version",
    description:"",
    group:"",
    examples:["version"],
    aliases:["ver", "about"],
    args:[],
    run:async ({msg})=>{
        var embed = await new MessageEmbed()
            .setFooter("Bot based on BeanEconomyOSR (Bean Economy Open Source Release)")
            .addField("Made by", "<@428485001349300224> (@fumple)")
            .addField("Source code", "https://github.com/fumple/beaneconomyosr/")
            .addField("Uptime", `<t:${Math.floor((Date.now()/1000) - process.uptime())}:R>`)
            .addColor((msg.guild||msg.author).id);
        msg.channel.s("", embed, msg)
    }
}