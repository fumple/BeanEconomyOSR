module.exports = {
    name:"eval",
    description:"",
    group:"",
    examples:[],
    aliases:[],
    args:[{
        type:"string",
        name:"code"
    }],
    superUserOnly:true,
    run:async (ctx)=>{
        eval(`try { (async ()=>{${ctx.args[0]}})() } catch (e) {}`)   
    }
}