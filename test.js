var fs = require("fs");
var shell = require("shelljs");

var data = 'hello fs forcing';

var filename = "./zebra/tits/moviess.txt"

shell.mkdir('-p', filename.replace(/^(.*\/).*$/, '$1'));

fs.writeFile(filename, data,
{
  encoding: "utf8",
  flag: "w",
  mode: 0o666
},
(err) => {
  if (err)
  console.log(err);
  else {
    console.log("File written successfully\n");
    console.log("The written has the following contents:");
    console.log(fs.readFileSync(filename, "utf8"));
  }
});
