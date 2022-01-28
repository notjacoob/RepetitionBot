const sim = require("string-similarity")
const fs = require("fs")
/**
 * @type {string[]}
 */
const lines = []

const reset = "\x1b[0m"
const blue = "\x1b[34m"
const green = "\x1b[32m"
const white = "\x1b[37m"

console.log("\n")

fs.readFileSync("scams.txt", "utf-8").split(/\r?\n/).forEach(ln => lines.push(ln))

const start = Date.now()
lines.forEach(scamurl => {
    const urls = scamurl.split("/")[(scamurl.includes("http") || scamurl.includes("https")) ? 2 : 0].split(".")[0]
    const urlai = urls.split("-")
    /**
     * @type {string[]}
     */
    const tested = []
    urlai.forEach(url => {
        if (!tested.includes(scamurl)) {
            const case1 = (sim.compareTwoStrings("discord", url) > 0.3) && (url != "discord" || urlai.length > 1)
            const case2 = sim.compareTwoStrings("nitro", url) > 0.3

            if ((sim.compareTwoStrings("discord", url) && (url != "discord" || urlai.length > 1)) || (sim.compareTwoStrings("nitro", url))) {
                console.log(`${blue}"${scamurl}"${white} ||${green} tested TRUE for being a scam${white} ||${blue} (${urlai})${white} || ${green}Contains similar term: ["discord": ${case1}], ["nitro": ${case2}]${reset}\n`)
                tested.push(scamurl)
            } else {
                if (urlai.length < 2) {
                    console.log(`"${scamurl}" tested FALSE for being a scam`)
                } else {
                    tested.push(scamurl)
                }
            }
        }
    })
})
const end = Date.now()

console.log("Took " + (end - start) + " ms to scan")