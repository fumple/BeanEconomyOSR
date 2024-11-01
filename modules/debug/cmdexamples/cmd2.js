module.exports = {
    name:"cmd",
    description:"",
    group:"",
    examples:["no"],
    aliases:[],
    args:[],
    run:async ({client, msg, prefix, cmd, args})=>{
        msg.channel.send("I am cmd2, thank you for picking me");
    }
}