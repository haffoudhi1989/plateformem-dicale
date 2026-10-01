const parser = require("@babel/parser");
const fs = require("fs");
const f = process.argv[2];
parser.parse(fs.readFileSync(f, "utf8"), { sourceType: "module", plugins: ["jsx"] });
console.log("JSX OK: " + f);
