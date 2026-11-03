import { createServer } from 'node:http';
import { writeFile } from 'node:fs';

let controllers = [
    {
        name: "sum",
        func: function (request, response){
            let items = request.url.split("/");
            response.writeHead(200);
            response.write((Number(items[2]) + Number(items[3])).toString());
            response.end();
        }
    },
    {
        name: "createFile",
        func: function (request, response){
            let items = request.url.split("/");

            writeFile(items[2], items[3], function(){
                console.log("createFile done");

                response.writeHead(200);
                response.write("createFile done");
                response.end();
            });
            
        }
    }
]


function serverCallback(request, response) {
    console.log("------------------------");
    console.log("url", request.url);

    let found = false;

    for (let controller of controllers) {
        if (request.url.startsWith('/' + controller.name)) {
            found = true;
            controller.func(request, response);
            break;
        }
    }

    if (!found) {
        console.log("path not found.");
    }
}

let server = createServer(serverCallback);

server.listen(555);