module.exports = {
    name:"virtual",
    description:"",
    group:"",
    examples:[],
    aliases:[],
    args:[],
    subcommands:[{
        name:"real",
        description:"",
        group:"",
        examples:[],
        aliases:[],
        args:[],
        run:async ({client, msg, prefix, cmd, args})=>{
            client.processCommand(msg, "settings get base * cmd.ping.message");
        }
    },{
        name:"fake",
        description:"",
        group:"",
        examples:[],
        aliases:[],
        args:[],
        run:async ({client, msg, prefix, cmd, args})=>{
            client.processCommand(msg, "fake idk why I added this, kinda forgot", {
                name:"fake",
                args:[{
                    type:"string",
                    name:"why"
                }],
                run:async ctx=>{
                    ctx.msg.channel.send("Virtual Fake command works!\nArgument 0: "+ctx.args[0])
                }
            });
        }
    }],
    run:async ({client, msg, prefix, cmdname, args})=>{
        client.processCommand(msg, "help "+cmdname);
    }
}