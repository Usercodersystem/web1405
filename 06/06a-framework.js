
import { createServer } from 'node:http';

function framework() {

    let controllers = [];

    let app = {

        get: function(path, func) {
            controllers.push({
                name: path,
                func: func
            });
        },

        listen: function(port, callback) {

            function serverCallback(request, response) {

                console.log("--------------------");
                console.log("url", request.url);

                let data = "";

                request.on("data", function(part) {
                    data += part;
                });

                request.on("end", function() {

                    console.log("data", data);

                    try {
                        request.data = JSON.parse(data);
                    }
                    catch(e) {
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

                        if (items[0] === item.name) {

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