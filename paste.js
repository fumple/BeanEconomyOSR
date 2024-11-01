const EasyTable = require("easy-table");
const axios = require('axios').default;

var pasteHost = null;
var pasteToken = null;

module.exports = {
    setConfig(host, token) {
        pasteHost = host;
        pasteToken = token;
    },
    isPasteAvailable() {
        return pasteToken != null;
    },
    async uploadTable(name, objects) {
        if(!this.isPasteAvailable()) {
            return false;
        }
        const formatted = EasyTable.print(objects);
        const res = await axios.postForm(pasteHost, {
            'api_dev_key': pasteToken,
            'api_option': 'paste',
            'api_paste_code': formatted,
            'api_paste_name': name,
            'api_paste_private': 1,
            'api_paste_expire_date': '1D',
        });
        return `${res.data} (${res.data.replace('pastebin.com/', 'pastebin.com/raw/')})`;
    },
}