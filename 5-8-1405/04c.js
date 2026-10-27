import { createServer } from 'node:http';
import { writeFile , readFile} from 'node:fs';

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

            writeFile(items[2], items[3], function(err){
                if(err)
                {
                    console.log("createFile error");

                    response.writeHead(500);
                    response.write("createFile error");
                    response.end();
                }
                else
                {
                    console.log("createFile done");

                    response.writeHead(200);
                    response.write("createFile done");
                    response.end();
                }
                
            });
            
        }
    },
    {
        name: "read",
        func: function (request, response){
            let items = request.url.split("/");

            readFile(items[2], function(err,data){
                if(err)
                {
                    console.log("readFile error");

                    response.writeHead(500);
                    response.write("readFile error");
                    response.end();
                }
                else
                {
                    console.log("readFile done");

                    response.writeHead(200);
                    response.write(data);
                    response.end();
                }
                
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