import {createServer} from "http";

function myserver(request,response)
{
    console.log("hello world");
}

let server = createServer(myserver);
server.listen(8080);