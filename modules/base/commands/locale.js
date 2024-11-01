module.exports = {
    name:"locale",
    description:"Some parts of the bot support localization, but not many.\nProvide no locale to view your current locale, or provide one to change it.\nThe default locale is `en-US`\nLooking for a list of valid locales? Too bad as I don't have one either",
    group:"",
    examples:["locale","locale en-US","locale pl-PL"],
    aliases:["lang"],
    args:[{
        type:"locale",
        name:"locale",
        default:null
    }],
    run:async (ctx)=>{
        if(ctx.args[0] == null){
            return await ctx.msg.channel.s("Your current locale is `"+(await ctx.$.locale(ctx.msg.author.id, (ctx.guild||{}).id))+"`", null, ctx.msg);
        }
        const affected = await ctx.client.settings.set("base", ctx.msg.author.id, "locale", ctx.args[0]);
        await ctx.msg.channel.s(affected > 0 ? ctx.$.emoji.check+" Updated your locale!" : ctx.$.emoji.xmark+" Something went wrong...", null, ctx.msg);
    }
}