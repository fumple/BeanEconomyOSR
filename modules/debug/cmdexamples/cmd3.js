module.exports = {
    name:"cmd3",
    description:"",
    group:"",
    examples:["no"],
    aliases:["*"],
    args:[],
    shouldRun: (ctx)=>{
        return ctx.cmdname == "cmd" || ctx.cmdname == "cmd3";
    },
    run:async ({client, msg, prefix, cmd, args})=>{
        msg.channel.send("I am cmd3, thank you for picking me");
    }
}