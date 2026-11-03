
import framework from './04d-framework.js';
import { writeFile, readFile } from 'node:fs';

const app = framework();
const port = 3000;

app.get('sum', function (request, response) {
    const items = request.url.split('/');

    response.writeHead(200);
    response.write(
        (Number(items[2]) + Number(items[3])).toString()
    );
    response.end();
});

app.get('createFile', function (request, response) {
    const items = request.url.split('/');

    writeFile(items[2], items[3], function (err) {
        if (err) {
            console.log('createFile error');

            response.writeHead(500);
            response.write('createFile error');
            response.end();
        } else {
            console.log('createFile done');

            response.writeHead(200);
            response.write('createFile done');
            response.end();
        }
    });
});

app.get('readFile', function (request, response) {
    const items = request.url.split('/');

    readFile(items[2], function (err, data) {
        if (err) {
            console.log('readFile error');

            response.writeHead(500);
            response.write('readFile error');
            response.end();
        } else {
            console.log('readFile done');

            response.writeHead(200);
            response.write(data);
            response.end();
        }
    });
});

app.listen(port, function () {
    console.log(`Example app listening on port ${port}`);
});
