import { createServer } from 'node:http';

function framework(){
    let controllers = [];
    let app = {
        get: function(path, func){
            controllers.push({
                method: 'GET',
                name: path,
                func: func
            })
        },
        put: function(path, func){
            controllers.push({
                method: 'PUT',
                name: path,
                func: func
            })
        },
        post: function(path, func){
            controllers.push({
                method: 'POST',
                name: path,
                func: func
            })
        },
        delete: function(path, func){
            controllers.push({
                method: 'DELETE',
                name: path,
                func: func
            })
        },
        listen: function(port, userCallback){
            function serverCallback(request, response){
                console.log("---------------------------------------------");
                console.log("(framework) url: ", request.method, request.url);

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
                        if(request.url.startsWith('/' + item.name) && item.method === request.method){
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