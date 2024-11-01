module.exports = {
    name:"mass",
    description:"",
    group:"",
    examples:[],
    aliases:[],
    args:[{
        type:"string",
        name:"command1"
    }],
    ownerOnly:true,
    run:async (ctx)=>{
        var listener = async msg=>{
            if(msg.channel.id != ctx.msg.channel.id) return;
            if(msg.author.id != ctx.msg.author.id) return;
            if(ctx.client._waitingForAnswer.find(e=>e.u==msg.author.id&&e.c==msg.channel.id) != null) return;
            if(msg.content == "cancelmass") {
                ctx.client.off("message", listener);
                msg.channel.s("Mass cmd stopped", null, msg);
                return;
            }
            if(ctx.args[0].includes("{arg}")) await ctx.client.processCommand(msg, ctx.args[0].replace(/\{arg\}/g, msg.content));
            else await ctx.client.processCommand(msg, ctx.args[0]+msg.content);
        }
        ctx.client.on("message", listener);
        ctx.msg.channel.s("Mass cmd started! Type `cancelmass` to quit", null, ctx.msg);

    }
}