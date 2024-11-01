module.exports = {
    name:"economy-run",
    description:"",
    group:"",
    examples:[],
    aliases:["*"],
    args:[/*{
        type:"string",
        name:"command",
        default:(ctx)=>ctx.cmdname
    },*/{
        type:"bool",
        name:"debug",
        default:false
    }],
    debug:true,
    hidden:true,
    guildOnly:true,
    shortPrefix:true, //Botch, to prevent conflicts
    shouldRun: async (ctx)=>{
        const cmds = await ctx.client.database.all("SELECT `name` FROM commands", []); // just get all of them, should hurt performance by that much
        return cmds.find(e=>ctx.cmdname==e.name||ctx.allRoles.map(i=>ctx.cmdname+":"+i.id).includes(e.name)) != null;
    },
    run:async (ctx)=>{
        ctx.$.economycustom.run(ctx.cmdname, ctx.msg, ctx.args[0])
    }
}