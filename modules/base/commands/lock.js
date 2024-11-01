module.exports = {
    name:"lock",
    description:"",
    group:"",
    examples:[],
    aliases:[],
    args:[{
        type: "string",
        name: "reason"
    }],
    ownerOnly: true,
    run:async ({client, msg, args})=>{
        client.settings.set("base", "*", "lock", args[0])
            .then(()=>{
                msg.channel.s("Success!", null, msg)
            })
            .catch(()=>{
                msg.channel.s("Failed!\nTry manually locking the bot, by setting the value of setting base::lock", null, msg)
            })
    }
}
