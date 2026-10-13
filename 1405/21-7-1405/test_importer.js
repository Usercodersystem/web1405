import controllers from "./md/controllers.js";

let command = process.argv[2];
let input = process.argv.slice(3);

console.log("--------------------------");
console.log("command is:", command);
console.log("inputs are:", input);

//--------------------------------------------------

let found = false;

for (let i = 0; i < controllers.length; i++) {

    if (controllers[i].name === command) {
        found = true;
        controllers[i].func(input);
        break;
    }
}

if (!found) {
    console.log("err command not found!!!!!!!!!!");
}