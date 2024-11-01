const paste = require("../../../paste");

module.exports = {
    name:"cooldowns",
    description:`Export all cooldowns to pastebin.com`,
    group:"",
    examples:[],
    args:[],
    ownerOnly: true,
    cooldown: 10,
    canRunArgs: (ctx)=>{
        if(!paste.isPasteAvailable()) return "Exporting data to PasteBin is not set up, please set a token in config.json";
    },
    run:async ctx=>{
        const cooldowns = await ctx.client.database.all("SELECT commandname, guildid, userid, endsat FROM cooldown", []);
        if(cooldowns.length < 1)
            return await ctx.msg.channel.s(ctx.client.$.emoji.xmark+" No cooldowns to export...")

        await ctx.msg.channel.s(await paste.uploadTable("cooldowns", cooldowns) || ctx.client.$.emoji.xmark+" Failed to generate paste URL...", null, ctx.msg);
    }
}