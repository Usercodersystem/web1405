import { createServer } from "http";
import {writeFile} from "node:fs";
let controllers = [
    {
        name: "sum",
        func: function myserver(request, response) {
            const parts = request.url.split("/").filter(Boolean);
            console.log(parts);
            const first = Number(parts[1]);
            const second = Number(parts[2]);

            if (!Number.isFinite(first) || !Number.isFinite(second)) {
                response.statusCode = 400;
                response.end("لطفاً دو عدد در آدرس وارد کنید؛ مثل /10/20");
                return;
            }

            response.end(String(first + second));
        }
    },
    {
        name: "minus",
        func: function myserver(request, response) {
            const parts = request.url.split("/").filter(Boolean);
            const first = Number(parts[1]);
            const second = Number(parts[2]);

            if (!Number.isFinite(first) || !Number.isFinite(second)) {
                response.statusCode = 400;
                response.end("لطفاً دو عدد در آدرس وارد کنید؛ مثل /10/20");
                return;
            }

            response.end(String(first - second));
        }
    },
    {
        name: "createfile",
        func: function myserver(request, response) {
            const parts = request.url.split("/");
            const name = parts[2];
            const data = parts[3];
            
            writeFile(name,data,function(){
                response.end("file created!!!");
            });
            
            

            
        }
    }
];


function myserver(request, response) {
    const parts = request.url.split("/");
    let found = false;
    for (let i = 0; i < controllers.length; i++) {
        if (request.url.startsWith("/"+controllers[i].name)) {
            found = true;
            controllers[i].func(request, response);
            break;
        }
    }
    if(!found)
    {
        response.end("Err Command not found");
    }
}

const server = createServer(myserver);
server.listen(8080);
