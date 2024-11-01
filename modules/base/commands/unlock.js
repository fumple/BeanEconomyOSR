module.exports = {
    name:"unlock",
    description:"",
    group:"",
    examples:[],
    aliases:[],
    args:[],
    ownerOnly: true,
    run:async ({client, msg})=>{
        client.settings.deleteKey("base", null, "lock")
            .then(()=>{
                msg.channel.s("Success!", null, msg)
            })
            .catch(()=>{
                msg.channel.s("Failed!\nTry manually unlocking the bot, by removing the value from setting base::lock", null, msg)
            })
    }
}
