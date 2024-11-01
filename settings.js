class Settings {
    client;
    constructor(client){
        this.client = client;
    }
    getKeys = (m=null)=>{
        if(m == null){
            var allSettings = [];
            for(var m of this.client._modules){
                if(m.settings != null && (m.settings||[]).length > 0) allSettings.concat(...m.settings.map(e=>({...e,module:m.id})))
            }
            return allSettings;
        }
        else{
            var m = this.client._modules.find(e=>e.id==m);
            if(m == null) return;
            return (m.settings||[]).map(e=>({...e,module:m.id}));
        }
    };
    getKey = (m,key)=>{
        var m = this.client._modules.find(e=>e.id==m);
        if(m == null) return;
        return (m.settings||[]).find(e=>e.name==key);
    };
    getRaw = (m,gid,key)=>{
        return new Promise(k=>{
            k(this.client.database.all("SELECT id, value FROM setting WHERE `module`=? AND `guildid`=? AND `key`=?", [m,gid,key]));
        })
    };
    get = (m,gid,key,alwaysArray=false)=>{
        var fk = this.getKey(m, key);
        if(fk == null) return null;
        return new Promise(async (k,no)=>{
            this.client.database[fk.array ? "all" : "get"]("SELECT id, value FROM setting WHERE `module`=? AND `guildid`=? AND `key`=?", [m,gid,key]).then(async e=>{
                if((e||[]).length == 0) {
                    if(gid != "*"){
                        var getall = await this.getRaw(m,"*",key).catch(no);
                        if(getall.length > 0){
                            if(alwaysArray) return k(getall);
                            return k(fk.array ? getall : getall[0]);
                        }
                    }
                    if(fk.default == null) return k([]);
                    if(alwaysArray) return k(fk.array ? fk.default.map(e=>({id:"default",value:e})) : [{id:"default",value:fk.default}]);
                    return k(fk.array ? fk.default.map(e=>({id:"default",value:e})) : {id:"default",value:fk.default});
                }
                k(e);
            }).catch(no)
        })
    };
    getAll = (m,key)=>{
        var fk = this.getKey(m, key);
        if(fk == null) return null;
        return new Promise(async (k,no)=>{
            this.client.database.all("SELECT id, guildid, value FROM setting WHERE `module`=? AND `key`=?", [m,key]).then(async e=>{
                if(fk.default != null) k([...e, ...(fk.array ? fk.default.map(e=>({id:"default",guildid:"default",value:e})) : [{id:"default",guildid:"default",value:fk.default}])]);
                else k([...e])
            }).catch(no)
        })
    };
    getWithParent = (m,gid,key,keyHistory = [])=>{
        var fk = this.getKey(m, key);
        if(fk == null) return null;
        if(!fk.array) return null;
        if(keyHistory.includes(key)) return null;
        var fkp = fk.parent;
        return new Promise(async (k,no)=>{
            var extra = [];
            if(fkp != null) extra = await this.getWithParent(m,gid,fkp.name,[...keyHistory, key]);
            k([...(extra||[]), ...await this.get(m,gid,key,true)]);
        })
    };
    getById = (id)=>{
        return new Promise(k=>{
            k(this.client.database.all("SELECT module, guildid, key, value FROM setting WHERE `id`=?", [id]));
        })
    };
    delete = (id)=>{
        return new Promise(k=>{
            k(this.client.database.run("DELETE FROM setting WHERE `id`=?", [id]));
        })
    };
    deleteKey = (m,gid,key)=>{
        return new Promise(k=>{
            if(gid == null) k(this.client.database.run("DELETE FROM setting WHERE `module`=? AND `key`=?", [m,key]));
            else k(this.client.database.run("DELETE FROM setting WHERE `module`=? AND `guildid`=? AND `key`=?", [m,gid,key]));
        })
    };
    update = (id,v)=>{
        return new Promise(k=>{
            k(this.client.database.run("UPDATE setting SET `value`=? WHERE `id`=?", [v,id]));
        })
    };
    moveRaw = (id,m,gid,key)=>{
        return new Promise(k=>{
            k(this.client.database.run("UPDATE setting SET `module`=?, `guildid`=?, `key`=? WHERE `id`=?", [m,gid,key,id]));
        })
    };
    insertRaw = (m,gid,key,v)=>{
        return new Promise(k=>{
            k(this.client.database.run("INSERT INTO setting (`module`, `guildid`, `key`, `value`) VALUES (?,?,?,?)", [m,gid,key,v]));
        })
    };
    insert = (m,gid,key,v)=>{
        var fk = this.getKey(m, key);
        if(fk == null) return null;
        if(!fk.array) return null;
        return new Promise(k=>{
            k(this.insertRaw(m,gid,key,v));
        })
    };
    set = (m,gid,key,v)=>{
        var fk = this.getKey(m, key);
        if(fk == null) return null;
        if(fk.array) return null;
        return new Promise(async k=>{
            var curr = await this.getRaw(m,gid,key);
            if(curr.length > 0) k(this.update(curr[0].id,v));
            else k(this.insertRaw(m,gid,key,v));
        })
    }
}

module.exports = Settings;
