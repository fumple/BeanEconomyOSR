module.exports = {
    name:"ping",
    description:"",
    group:"",
    examples:["ping"],
    aliases:[],
    args:[],
    run:async ({client, msg, prefix, cmd, args})=>{
        var msgs = await client.settings.get("base", (msg.guild||msg.author).id, "cmd.ping.message");
        msg.channel.s(msgs[Math.floor(Math.random() * msgs.length)].value, null, msg, {allowedMentions:{parse:[]}});
    }
}