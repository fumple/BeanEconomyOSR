const { MessageEmbed } = require("discord.js");

var queue = [];
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function processCommand(ctx){
    function debug(_e) {if(ctx.debug) ctx.msg.channel.send("[DEBUG] "+_e, {allowedMentions:{parse:[]}});}
    function error(_c, _e) {ctx.msg.channel.s("[ERROR] {Code: "+_c+"} "+_e, null, ctx.msg, {allowedMentions:{parse:[]}});}
    //const sortedRoles = [...ctx.allRoles].sort((a,b)=>a.comparePositionTo(b)*-1); //I hate this
    const sortedRoles = [...ctx.msg.member.roles.cache.values()].sort((a,b)=>a.comparePositionTo(b)*-1);
    //debug("{INFO} Your roles: "+sortedRoles.map(e=>e.name).join(", "));
    const cmds = await ctx.client.database.all("SELECT * FROM commands WHERE `enabled` = ?", [true]);
    const targetRole = sortedRoles.find(r=>cmds.findIndex(e=>e.name==ctx.cmdname+":"+r.id)!=-1);
    const cmd = 
        targetRole != null ? 
        cmds.find(e=>e.name==ctx.cmdname+":"+targetRole.id) : 
        cmds.find(e=>e.name==ctx.cmdname)
    var targetcmd = cmd;
    if(cmd == null) return debug("{STOP} Command not found/enabled")
    debug("{INFO} Found: "+JSON.stringify(cmd))

    if(cmd.type==3) {
        debug("{INFO} Command is an alias to "+cmd.target)
        if(cmd.target.endsWith(":")) {
            let targetRole2 = sortedRoles.find(r=>cmds.findIndex(e=>e.name==cmd.target+r.id)!=-1);
            targetcmd = targetRole2 != null ? 
                cmds.find(e=>e.name==cmd.target+targetRole2.id) : 
                cmds.find(e=>e.name==cmd.target.substr(0,cmd.target.length-1))
        }
        else targetcmd = cmds.find(e=>e.name==cmd.target);
        if(targetcmd.type == 3) return error("ECONOMYCUSTOM-RUN2", ctx.$.emoji.xmark+" Error! Alias cannot point to another alias. (This may change in the future)")
        if(targetcmd.enabled == false) return debug("{STOP} Target command not found/enabled")
    }
    if(targetcmd.type==2) return await ctx.msg.channel.s("", new MessageEmbed().setColor("RED").setDescription(ctx.client.$.emoji.xmark+" "+targetcmd.message), ctx.msg);

    function get(prop) {
        return cmd[prop]||targetcmd[prop]
    }

    //Cooldown
    const cooldown = await ctx.client.database.cooldown("economycustom::cc-"+cmd.name/*+(targetRole != null ? ":"+targetRole.id : "")*/, ctx.msg.guild.id, ctx.msg.author.id); //"*"
    //debug("{INFO} Cooldown: "+cooldown);
    if(cooldown != null){
        var diff = cooldown - new Date();
        var remaining = diff / 1000;
        if(remaining > 0){
            var seconds = Math.floor(remaining % 60);
            var minutes = Math.floor(remaining / 60) % 60;
            var hours = Math.floor(Math.floor(remaining / 60) / 60) % 24;
            var days = Math.floor(Math.floor(Math.floor(remaining / 60) / 60) / 24);
            return await ctx.msg.channel.send(new MessageEmbed({description:ctx.$.emoji.xmark+" You must wait `"+
            (days != 0 ? (days != 1 ? days+" days, " : days+" day, ") : "")+
            (hours != 0 ? (hours != 1 ? hours+" hours, " : hours+" hour, ") : "")+
            (minutes != 0 ? (minutes != 1 ? minutes+" minutes and " : minutes+" minute and ") : "")+
            (seconds != 1 ? seconds+" seconds" : seconds+" second")
            +"` before you can use this command again", color:"RED"}));
        }
    }
    
    //Replies
    var replies = await ctx.client.database.all("SELECT * FROM replies WHERE `enabled` = ? AND (`command` = ? OR `command` = ?)", [true, cmd.name, targetcmd.name]);
    if(replies.length == 0) return error("ECONOMYCUSTOM-RUN1", ctx.$.emoji.xmark+" Error! Command has no replies! Couldn't continue")
    var grouped = {success:replies.filter(e=>e.type=="success"),fail:replies.filter(e=>e.type=="fail")};
    debug("{INFO} Found "+grouped.success.length+"S:"+grouped.fail.length+"F ("+replies.length+") replies, let the RNG take over");

    //Determine outcome, you get what I mean, yeah naming is confusing
    var outcome;
    if(grouped.success.length == 0) { debug("{INFO} No replies for 'success' found, defaulting to 'fail'..."); outcome = "fail"; }
    else if(grouped.fail.length == 0) { debug("{INFO} No replies for 'fail' found, defaulting to 'success'..."); outcome = "success"; }
    else {
        const randomOutcome = Math.random();
        if(randomOutcome <= get("successChance")) outcome = "success"; else outcome = "fail";
        debug("{INFO} Determined outcome: "+outcome);
    }
    const rpl = grouped[outcome][Math.floor(Math.random() * grouped[outcome].length)];
    debug("{INFO} Picked reply: `"+JSON.stringify(rpl)+"`, determining payout...");

    //Determine payout
    const payoutRange = [rpl.minPayout != null ? rpl.minPayout : get(outcome+"minPayout"), rpl.maxPayout != null ? rpl.maxPayout : get(outcome+"maxPayout")];
    if(payoutRange.some(e=>e==null)){
        return error("ECONOMYCUSTOM-RUN2", ctx.$.emoji.xmark+" Error! Invalid payout range [rplid: "+rpl.id+"] (min==null||max==null)")
    }
    const payout = getRandomIntInclusive(...payoutRange.sort());
    //debug("{INFO} Payout determined, attempting to add money...");
    
    //Finishing touches
    try{
        if(payout != 0)
            await ctx.client.$.economy.patchUser(ctx.msg.guild.id, ctx.msg.author.id, payout, 0, "Ran economy command [(MSG)]("+ctx.msg.url+") [cmd="+cmd.name+"&reply="+rpl.id+"]").catch(()=>{});
    }
    catch(e){
        return error("ECONOMYCUSTOM-RUN3", "Failed to add money to you, please try again later... [E: "+e.message+"]")
    }
    try{
        const rplauthor = (await ctx.client.users.fetch(rpl.author).catch(()=>{})) || {};
        await ctx.client.database.setcooldown("economycustom::cc-"+cmd.name, ctx.msg.guild.id, ctx.msg.author.id, rpl.cooldown||get("cooldown"));
        await ctx.msg.channel.s("",
            new MessageEmbed()
            .setFooter("Reply by "+(rplauthor.tag||"UnknownUser#0000"), (rplauthor.avatarURL != null ? rplauthor.avatarURL({dynamic:true}) : ""))
            .setColor(rpl.type == "success" ? (payout > get("outcomeBorder") ? "GREEN" : "YELLOW") : (payout < get("outcomeBorder") ? "RED" : "YELLOW"))
            .setDescription(rpl.content.replace("{amount}", (await ctx.$.economy.getSymbol(ctx.msg.guild.id))+payout)), // await ctx.$.economy.symbol
            ctx.msg
        )
        await ctx.client.database.setlastran(ctx.msg.guild.id, ctx.msg.author.id, ctx.cmdname, ctx.msg.channel.id, ctx.msg.id).catch(console.error);
        // if something goes wrong, just log it
    }
    catch(e){
        if(payout != 0)
            await ctx.client.$.economy.patchUser(ctx.msg.guild.id, ctx.msg.author.id, -payout, 0, "Economy command error [(MSG)]("+ctx.msg.url+") [cmd="+cmd.name+"&reply="+rpl.id+"]").catch(()=>{});
        return error("ECONOMYCUSTOM-RUN4", "Something went wrong, please try again later... [E: "+e.message+"]")
    }
}
async function checkQueue(){
    if(queue.length > 0) {
        var item = queue[0];
        queue = queue.slice(1);
        await processCommand(item);
    }
    setTimeout(checkQueue, 100)
}
setTimeout(checkQueue, 100)
module.exports = {run:ctx=>{
    queue.push(ctx);
}}