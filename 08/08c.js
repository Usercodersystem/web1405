import framework from './07a-framework.js';
import { writeFile, readFile, unlink, rm } from 'node:fs';
import jwt from 'jsonwebtoken';

const app = framework();
const port = 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key';
const JWT_EXPIRES_IN = '1h';

function checkUser(user, options = {}) {
    const { requireId = true } = options;

    if (!user || typeof user !== 'object') {
        return 'user data is required';
    }

    if (requireId) {
        if (user.id === undefined || user.id === null || user.id === '') {
            return 'id is required';
        }
    }

    if (!user.username || typeof user.username !== 'string') {
        return 'username is required';
    }

    if (!user.password || typeof user.password !== 'string') {
        return 'password is required';
    }

    return null;
}

function isAdmin(user) {
    if (!user || typeof user !== 'object') {
        return false;
    }
    return (
        user.isAdmin === true ||
        user.is_admin === true ||
        user.role === 'admin' ||
        user.type === 'admin'
    );
}

function extractToken(request) {
    if (!request || typeof request !== 'object') {
        return null;
    }

    const headers = request.headers || {};

    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader && typeof authHeader === 'string') {
        const parts = authHeader.trim().split(/\s+/);
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            return parts[1];
        }
        if (parts.length === 1 && parts[0]) {
            return parts[0];
        }
    }

    const tokenHeader = headers['token'] || headers['x-token'] || headers['x-access-token'];
    if (tokenHeader && typeof tokenHeader === 'string' && tokenHeader.trim()) {
        return tokenHeader.trim();
    }

    if (typeof request.token === 'string' && request.token.trim()) {
        return request.token.trim();
    }

    try {
        if (typeof request.url === 'string' && request.url) {
            const url = new URL(request.url, 'http://localhost');
            const queryToken =
                url.searchParams.get('token') ||
                url.searchParams.get('access_token') ||
                url.searchParams.get('jwt');
            if (queryToken && queryToken.trim()) {
                return queryToken.trim();
            }
        }
    } catch (e) {
        return null;
    }

    if (request.data && typeof request.data === 'object') {
        const bodyToken = request.data.token || request.data.access_token || request.data.jwt;
        if (typeof bodyToken === 'string' && bodyToken.trim()) {
            return bodyToken.trim();
        }
    }

    if (typeof request.data === 'string' && request.data.length > 0) {
        try {
            const parsed = JSON.parse(request.data);
            if (parsed && typeof parsed === 'object') {
                const bodyToken = parsed.token || parsed.access_token || parsed.jwt;
                if (typeof bodyToken === 'string' && bodyToken.trim()) {
                    return bodyToken.trim();
                }
            }
        } catch (e) {
            return null;
        }
    }

    if (Array.isArray(request.cookies)) {
        for (const cookie of request.cookies) {
            if (cookie && typeof cookie === 'object' && typeof cookie.token === 'string' && cookie.token.trim()) {
                return cookie.token.trim();
            }
        }
    }

    const cookieHeader = headers['cookie'];
    if (cookieHeader && typeof cookieHeader === 'string') {
        const cookies = cookieHeader.split(';');
        for (const part of cookies) {
            const [name, ...rest] = part.trim().split('=');
            if ((name === 'token' || name === 'access_token' || name === 'jwt') && rest.length) {
                const value = decodeURIComponent(rest.join('=').trim());
                if (value) {
                    return value;
                }
            }
        }
    }

    return null;
}

function verifyToken(request) {
    const token = extractToken(request);

    if (!token) {
        return { ok: false, status: 401, message: 'token is required' };
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded || typeof decoded !== 'object') {
            return { ok: false, status: 401, message: 'invalid token payload' };
        }

        return { ok: true, payload: decoded, token };
    } catch (err) {
        if (err && err.name === 'TokenExpiredError') {
            return { ok: false, status: 401, message: 'token expired' };
        }
        return { ok: false, status: 401, message: 'invalid token' };
    }
}

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

    const validationError = checkUser(newUser, { requireId: false });
    if (validationError) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(validationError);
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
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const items = pathname.split('/').filter(Boolean);
    const userId = items[1];

    console.log('DELETE raw url:', request.url);
    console.log('DELETE pathname:', pathname);
    console.log('DELETE items:', items);
    console.log('DELETE userId:', userId);

    if (!userId) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return response.end('user id is required');
    }

    readDb(function (err, db) {
        if (err) {
            console.log(err);
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('read error');
        }

        console.log('db.users ids:', db.users.map(u => u.id));

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
    const auth = verifyToken(req);

    if (!auth.ok) {
        res.writeHead(auth.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(auth.message);
    }

    if (auth.payload.isAdmin !== true) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('user is not admin');
    }

    console.log('PUT body:', req.data);

    let updatedUser = req.data;

    try {
        if (typeof updatedUser === 'string') {
            updatedUser = JSON.parse(updatedUser);
        }
    } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Invalid JSON data');
    }

    const validationError = checkUser(updatedUser, { requireId: true });
    if (validationError) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(validationError);
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
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
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

app.get('token', function (request, response) {
    const username = request.headers['username'] || request.headers['x-username'];
    const password = request.headers['password'] || request.headers['x-password'];

    if (!username || !password) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return response.end('username and password headers are required');
    }

    readDb(function (readErr, db) {
        if (readErr) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('read error');
        }

        const user = db.users.find(function (u) {
            return u.username === username && u.password === password;
        });

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('invalid username or password');
        }

        if (!isAdmin(user)) {
            response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('user is not admin');
        }

        const payload = {
            id: user.id,
            username: user.username,
            isAdmin: true
        };

        let token;
        try {
            token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        } catch (signErr) {
            console.log('token sign error:', signErr);
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('token generation failed');
        }

        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({
            message: 'token issued',
            token: token
        }));
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});