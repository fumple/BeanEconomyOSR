module.exports = {
    name:"notifications",
    description:"Once enabled you will receive a ping or DM when you can run a command again",
    group:"",
    examples:[],
    aliases:["notifs"],
    args:[],
    guildOnly: true,
    shortPrefix: true,
    subcommands: [{
        name:"enable",
        description:"Enable notifications",
        group:"",
        examples:[],
        aliases:["e"],
        args:[],
        guildOnly: true,
        shortPrefix: true,
        cooldown: 5,
        run:async (ctx)=>{
            let users = await ctx.client.settings.get("economycustom", ctx.msg.guild.id, "notifusers");
            let using = users.find(e=>e.value == ctx.msg.author.id);
            if(using) {
                ctx.msg.channel.s(ctx.client.$.emoji.xmark+" You already have notifications enabled", null, ctx.msg);
            } else {
                let notifmsg = await ctx.msg.author.send("This is a test message, intended to check whether I can DM you.\nThis message was sent because you tried to enable notifications (<"+ctx.msg.url+">)").catch(()=>{});
                if (notifmsg == null) {
                    ctx.msg.channel.s(ctx.client.$.emoji.xmark+" To enable notifications I must be able to DM you", null, ctx.msg);
                } else {
                    let success = await ctx.client.settings.insert("economycustom", ctx.msg.guild.id, "notifusers", ctx.msg.author.id);
                    const done = ctx.client.$.emoji.check+" Done!"
                    const fail = ctx.client.$.emoji.xmark+" Failed to apply changes..."
                    ctx.msg.channel.s(success == 1 ? done : fail, null, ctx.msg);
                }
            }
        }
    },{
        name:"disable",
        description:"Disable notifications",
        group:"",
        examples:[],
        aliases:["d"],
        args:[],
        guildOnly: true,
        shortPrefix: true,
        run:async (ctx)=>{
            let users = await ctx.client.settings.get("economycustom", ctx.msg.guild.id, "notifusers");
            let using = users.find(e=>e.value == ctx.msg.author.id);
            if(!using) {
                ctx.msg.channel.s(ctx.client.$.emoji.xmark+" You are not using reminders", null, ctx.msg);
            } else {
                let success = await ctx.client.settings.delete(using.id);
                const done = ctx.client.$.emoji.check+" Done!"
                const fail = ctx.client.$.emoji.xmark+" Failed to apply changes..."
                ctx.msg.channel.s(success == 1 ? done : fail, null, ctx.msg);
            }
        }
    },{
        name:"test",
        description:"Test whether you can receive DMs",
        group:"",
        examples:[],
        aliases:["t"],
        args:[],
        guildOnly: true,
        shortPrefix: true,
        cooldown: 5,
        run:async (ctx)=>{
            await ctx.msg.author.send("This is a test message, intended to check whether I can DM you.\nThis message was sent because you requested it (<"+ctx.msg.url+">)").catch(()=>{});
        }
    }],
    run:async (ctx)=>{
        let users = await ctx.client.settings.get("economycustom", ctx.msg.guild.id, "notifusers");
        let using = users.find(e=>e.value == ctx.msg.author.id);
        ctx.msg.channel.s((using ? 
            ctx.client.$.emoji.online+" You have notifications enabled\nTo disable them, run `!notifs disable`" : 
            ctx.client.$.emoji.dnd+" You don't have notifications enabled\nTo enable then, run `!notifs enable`"), null, ctx.msg);
    }
}
