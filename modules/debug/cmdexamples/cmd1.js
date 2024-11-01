module.exports = {
    id:"cmd1",
    name:"cmd",
    description:"",
    group:"",
    examples:["no"],
    aliases:[],
    args:[],
    run:async ({client, msg, prefix, cmd, args})=>{
        msg.channel.send("I am cmd1, thank you for picking me");
    }
}