import { createServer } from 'node:http';

function framework(){
    let controllers = [];
    let app = {
        get: function(path, func){
            controllers.push({
                name: path,
                func: func
            })
        },
        listen: function(port, userCallback){
            function serverCallback(request, response){
                console.log("---------------------------------------------");
                console.log("(framework) url: ", request.url);

                let data = "";
                request.on("data", function(part){
                    data = data + part;
                });
                request.on("end", function(){
                    console.log("(framework) data:", data);

                    try{
                        request.data = JSON.parse(data);
                    }
                    catch(e){
                        console.log("(framework) data is not a valid JSON.");
                        request.data = data;
                    }
                    request.myKey = 'salam!';

                    let found = false;
                    for(let item of controllers){
                        if(request.url.startsWith('/' + item.name)){
                            console.log("(framework) controller: ", item.name);
                            found = true;
                            item.func(request, response);
                            break;
                        }
                    }
                    if(!found){
                        console.log("path not found.");
                    }
                });
            }
            let server = createServer(serverCallback);
            server.listen(port, userCallback);
        }
    }
    return app;
}

export { 
    framework 
}