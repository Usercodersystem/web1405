import framework from './06a-framework.js';
import { writeFile, readFile, unlink, rm, appendFile } from 'node:fs';


const app = framework();
const port = 3000;

app.get('sum', function (request, response) {
    const items = request.url.split('/');

    response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    response.end(
        (Number(items[2]) + Number(items[3])).toString()
    );
});

app.get('createFile', function (request, response) {
    const items = request.url.split('/');
    const fileName = items[2];
    const content = items[3] ?? '';

    writeFile(fileName, content, function (err) {
        if (err) {
            console.log('createFile error');
            response.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return response.end('createFile error');
        }

        console.log('createFile done');
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('createFile done');
    });
});

app.get('readFile', function (request, response) {
    const items = request.url.split('/');
    const fileName = items[2];

    readFile(fileName, function (err, data) {
        if (err) {
            console.log('readFile error');
            response.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return response.end('readFile error');
        }

        console.log('readFile done');
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end(data);
    });
});

app.get('deleteFile', function (request, response) {
    const items = request.url.split('/');
    const fileName = items[2];

    unlink(fileName, function (err) {
        if (err) {
            console.log('deleteFile error');
            response.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return response.end('deleteFile error');
        }

        console.log('deleteFile done');
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('deleteFile done');
    });
});

app.get('delete', function (request, response) {
    const items = request.url.split('/');
    const directoryName = items[2];

    if (!directoryName) {
        response.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        return response.end('Directory name is required');
    }

    rm(directoryName, { recursive: true }, function (err) {
        if (err) {
            console.log('delete error:', err.message);
            response.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return response.end('delete error');
        }

        console.log('delete done');
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('delete done');
    });
});


app.get('signup', function (req, res) {
    let newUser = req.data;

    // اگر داده به شکل رشته‌ی JSON رسیده باشد، آن را به آبجکت تبدیل کن
    try {
        if (typeof newUser === 'string') {
            newUser = JSON.parse(newUser);
        }
    } catch {
        res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        return res.end('Invalid JSON data');
    }

    if (!newUser || !newUser.username || !newUser.password) {
        console.log('Received req.data:', req.data);

        res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        return res.end('username and password are required');
    }

    readFile('db.json', 'utf8', function (readErr, data) {
        let users = [];

        // اگر فایل هنوز وجود نداشته باشد، آرایه‌ی خالی می‌سازیم
        if (readErr && readErr.code !== 'ENOENT') {
            res.writeHead(500, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return res.end('Could not read db.json');
        }

        // اگر فایل وجود دارد، کاربران قبلی را می‌خوانیم
        if (!readErr && data.trim()) {
            try {
                const db = JSON.parse(data);
                users = Array.isArray(db.users) ? db.users : [];
            } catch {
                res.writeHead(500, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
                return res.end('db.json contains invalid JSON');
            }
        }

        // افزودن کاربر جدید به انتهای آرایه
        users.push({
            username: newUser.username,
            password: newUser.password
        });

        const updatedData = JSON.stringify({ users }, null, 2);

        writeFile('db.json', updatedData, 'utf8', function (writeErr) {
            if (writeErr) {
                res.writeHead(500, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
                return res.end('Could not save user');
            }

            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });
            res.end(JSON.stringify({ message: 'signup done' }));
        });
    });
});




app.listen(port, function () {
    console.log(`Example app listening on port ${port}`);
});
