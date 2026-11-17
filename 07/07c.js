import framework from './07a-framework.js';
import { writeFile, readFile, unlink, rm } from 'node:fs';

const app = framework();
const port = 3000;

function readDb(callback) {
    readFile('db.json', 'utf8', function (err, data) {
        let db = { users: [] };

        if (err) {
            return callback(null, db);
        }

        if (data && data.length > 0) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    db.users = parsed;
                } else if (parsed && Array.isArray(parsed.users)) {
                    db = parsed;
                }
            } catch (e) {
                db = { users: [] };
            }
        }

        callback(null, db);
    });
}

function writeDb(db, callback) {
    writeFile('db.json', JSON.stringify(db, null, 2), callback);
}

app.get('sum', function (request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end((Number(items[1]) + Number(items[2])).toString());
});

app.get('createFile', function (request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const fileName = items[1];
    const content = items[2] ?? '';

    writeFile(fileName, content, function (err) {
        if (err) {
            console.log('createFile error');
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('createFile error');
        }
        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('createFile done');
    });
});

app.get('readFile', function (request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const fileName = items[1];

    readFile(fileName, function (err, data) {
        if (err) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('readFile error');
        }
        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(data);
    });
});

app.get('deleteFile', function (request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const fileName = items[1];

    unlink(fileName, function (err) {
        if (err) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('deleteFile error');
        }
        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('deleteFile done');
    });
});

app.get('delete', function (request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const directoryName = items[1];

    if (!directoryName) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return response.end('Directory name is required');
    }

    rm(directoryName, { recursive: true }, function (err) {
        if (err) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('delete error');
        }
        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('delete done');
    });
});

app.post('user', function (req, res) {
    let newUser = req.data;

    try {
        if (typeof newUser === 'string') {
            newUser = JSON.parse(newUser);
        }
    } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Invalid JSON data');
    }

    if (!newUser || !newUser.username || !newUser.password) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('username and password are required');
    }

    if (newUser.id === undefined || newUser.id === null || newUser.id === '') {
        newUser.id = Date.now().toString();
    } else {
        newUser.id = String(newUser.id);
    }

    readDb(function (readErr, db) {
        if (readErr) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('read error');
        }

        const exists = db.users.some(u => String(u.id) === String(newUser.id));
        if (exists) {
            res.writeHead(409, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('id already exists');
        }

        db.users.push(newUser);

        writeDb(db, function (writeErr) {
            if (writeErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Signup failed');
            }
            res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: 'User created', user: newUser }));
        });
    });
});

app.get('user', function (request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const userId = items[1];

    console.log('GET raw url:', request.url);
    console.log('GET pathname:', pathname);
    console.log('GET items:', items);
    console.log('GET userId:', userId);

    if (!userId) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return response.end('user id is required');
    }

    readDb(function (readErr, db) {
        if (readErr) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('read error');
        }

        console.log('db.users ids:', db.users.map(u => u.id));

        const user = db.users.find(x => String(x.id) === String(userId));

        console.log('GET found user:', user);

        if (user) {
            response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return response.end(JSON.stringify(user));
        } else {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('user not found');
        }
    });
});

app.delete('user', function (request, response) {
    const adminUsername = request.headers['admin_username'];
    const adminPassword = request.headers['admin_password'];

    console.log('--- DELETE DEBUG ---');
    console.log('admin_username:', adminUsername);
    console.log('admin_password:', adminPassword);

    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const userId = items[1];

    console.log('userId:', userId);

    if (!userId) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return response.end('user id is required');
    }

    if (!adminUsername || !adminPassword) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return response.end('admin_username and admin_password headers are required');
    }

    readDb(function (err, db) {
        if (err) {
            console.log(err);
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('read error');
        }

        console.log('db.users:', JSON.stringify(db.users, null, 2));

        const admin = db.users.find(function (user) {
            return (
                String(user.username) === String(adminUsername) &&
                String(user.password) === String(adminPassword) &&
                String(user.type) === 'admin'
            );
        });

        console.log('found admin:', admin);

        if (!admin) {
            response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('forbidden: admin access required');
        }

        const index = db.users.findIndex(function (user) {
            return String(user.id) === String(userId);
        });

        console.log('User index:', index);

        if (index === -1) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('user not found');
        }

        db.users.splice(index, 1);

        writeDb(db, function (err) {
            if (err) {
                console.log(err);
                response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                return response.end('delete error');
            }

            response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            response.end(JSON.stringify({
                message: 'user deleted',
                id: userId
            }));
        });
    });
});

app.put('user', function (req, res) {
    console.log('PUT body:', req.data);

    const updatedUser = req.data;

    if (
        !updatedUser ||
        updatedUser.id === undefined ||
        updatedUser.id === null ||
        !updatedUser.username ||
        !updatedUser.password
    ) {
        res.writeHead(400, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        return res.end('id, username and password are required');
    }

    const targetId = String(updatedUser.id);

    readDb(function (err, db) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('read error');
        }

        console.log('PUT targetId:', targetId);
        console.log('db.users ids:', db.users.map(u => u.id));

        const index = db.users.findIndex(function (user) {
            return String(user.id) === targetId;
        });

        console.log('PUT index:', index);

        if (index === -1) {
            res.writeHead(404, {
                'Content-Type': 'text/plain; charset=utf-8'
            });
            return res.end('user not found');
        }

        db.users[index] = {
            ...updatedUser,
            id: targetId
        };

        writeDb(db, function (err) {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('update error');
            }

            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            res.end(JSON.stringify({
                message: 'user updated successfully',
                user: db.users[index]
            }));
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});