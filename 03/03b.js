import {createServer} from "http";

function myserver(request,response)
{
    console.log("hello world");
    response.write(request.url);
    response.end();
}

let server = createServer(myserver);
server.listen(8080);