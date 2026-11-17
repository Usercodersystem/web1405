import { createServer } from 'node:http';

function framework() {

    let controllers = [];

    let app = {

        get: function(path, func) {
            controllers.push({
                method: "GET",
                name: path,
                func: func
            });
        },
        post: function(path, func) {
            controllers.push({
                method: "POST",
                name: path,
                func: func
            });
        },
        put: function(path, func) {
            controllers.push({
                method: "PUT",
                name: path,
                func: func
            });
        },
        delete: function(path, func) {
            controllers.push({
                method: "DELETE",
                name: path,
                func: func
            });
        },

        listen: function(port, callback) {

            function serverCallback(request, response) {
                console.log(controllers);
                console.log("--------------------");
                console.log("url", request.url);
                console.log("method", request.method);

                let data = "";

                request.on("data", function(part) {
                    data += part;
                });

                request.on("end", function() {

                    console.log("data", data);

                    try {
                        request.data = JSON.parse(data);
                    }
                    catch (e) {
                        request.data = data;
                    }

                    request.test = "testval";

                    const pathname = new URL(
                        request.url,
                        'http://localhost'
                    ).pathname;

                    const items = pathname.split('/').filter(Boolean);

                    let found = false;

                    for (let item of controllers) {

                        if (
                            items[0] === item.name &&
                            item.method === request.method
                        ) {
                            found = true;

                            console.log('before call');

                            item.func(request, response);

                            console.log('after call');

                            break;
                        }
                    }

                    if (!found) {
                        response.writeHead(404, {
                            'Content-Type': 'text/plain; charset=utf-8'
                        });

                        response.end('path not found');
                    }

                });

            }

            let server = createServer(serverCallback);

            server.listen(port, callback);
        }
    };

    return app;
}

export default framework;