module.exports = {
    name:"prefix",
    description:"",
    group:"",
    examples:["*none*"],
    aliases:[""],
    args:[],
    run:async (ctx)=>{
        return await ctx.msg.channel.s(
            `Hi! My prefix is \`${ctx.client._config.prefix}\`\nLooking for economy commands? They have been moved to \`${ctx.client._config.prefix}index\`/\`${ctx.client._config.prefix}cmds\``, null, ctx.msg);
    }
}