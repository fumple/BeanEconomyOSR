module.exports = {
    name:"sudo",
    description:"",
    group:"",
    examples:[],
    aliases:[],
    args:[{
        type:"member",
        name:"member"
    },{
        type:"string",
        name:"command"
    }],
    ownerOnly:true,
    guildOnly:true,
    run:async ({client, msg, prefix, cmdname, args})=>{
        msg._author = msg.author;
        msg._member = msg.member;
        msg.author = args[0].user;
        msg.member = args[0];
        client.processCommand(msg, args[1]);
    }
}