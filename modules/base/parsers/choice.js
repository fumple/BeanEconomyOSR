const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "choice",
    parse(_val,extra = {}){
        return new Promise(async (_k,_no)=>{
            const no = r=>{_no(r);if(extra.clean){prompts.forEach(v=>v.delete())}}
            const k = r=>{_k(r);if(extra.clean){prompts.forEach(v=>v.delete())}}
            if(extra.choices == "validTypes") extra.choices = Object.keys(this._parsers).map(e=>({key:e,value:e}));
            var ichoices = extra.choices.map(el=>(typeof el == "object" ? {...el, key:el.key.toLowerCase()} : {value:el, key:el.toLowerCase()}));
            var ival = _val.toLowerCase();
            var potential = ichoices.filter(el=>el.key.includes(ival));
            var prompts = [];
            if(potential.length == 0){
                return no("none");
            }
            else if(potential.length > 15){
                return no("toomany");
            }
            else if(potential.length == 1) {
                var value = potential[0].value;
                return k({value:value, key:value.toParserKey(), display:value.toParserDisplay()});
            }
            else if(this._interactive){
                prompts.push(await this._channel.send(await new MessageEmbed()
                    .addAuthor(this._user)
                    .setTitle("Mutliple choices found"+(extra.name!=null?" for "+extra.name:""))
                    .setDescription("Type one of the numbers below or type `cancel` to cancel this prompt\n"+potential.map((e,i)=>"**"+(i+1)+".** "+e.value.toParserDisplay()).join("\n"))
                    .addColor((this._guild||this._user).id)
                ))
                while(true){
                    var msg = await this._channel.awaitMessage(this._user.id, {time:30000,errors: ['time']}).catch(e=>e);
                    if(msg == "time") return no("time");
                    prompts.push(msg);
                    if(msg.content == "cancel") return no("cancel");
                    var pickedNum = parseInt(msg.content);
                    if(pickedNum != NaN && pickedNum >= 1 && pickedNum <= potential.length){
                        var value = potential[pickedNum-1].value;
                        return k({value:value, key:value.toParserKey(), display:value.toParserDisplay(), msg:msg});
                    }
                    else{
                        prompts.push(this._channel.send("Invalid number provided, type a number from the list above or send `cancel`"));
                    }
                }
            }
            else{
                return no("noninteractive");
            }
        })
    }
}