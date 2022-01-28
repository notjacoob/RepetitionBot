// @ts-nocheck
const wnpack = require("wordsninja")
const wn = new wnpack();

(async () => {
    await wn.loadDictionary()

    console.log(wn.splitSentence("free-nitro-at-this-link"))
})();
