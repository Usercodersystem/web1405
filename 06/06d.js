import framework from './06a-framework.js';
import { writeFile, readFile, unlink, rm, appendFile } from 'node:fs';

const app = framework();
const port = 3000;


app.get('sum', function (request, response) {
    const items = request.url.split('/');
    response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    response.end((Number(items[2]) + Number(items[3])).toString());
});

app.get('createFile', function (request, response) {
    const items = request.url.split('/');
    const fileName = items[2];
    const content = items[3] ?? '';

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
    const items = request.url.split('/');
    const fileName = items[2];

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
    const items = request.url.split('/');
    const fileName = items[2];

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
    const items = request.url.split('/');
    const directoryName = items[2];

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




app.get('signup', function (req, res) {
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

    
    newUser.id = Date.now().toString(); 

    readFile('db.json', 'utf8', function (readErr, data) {
        let users = [];

        if (data && data.length > 0) {
            try {
                users = JSON.parse(data);
            } catch (e) {
                users = [];
            }
        }

        users.push(newUser);

        writeFile('db.json', JSON.stringify(users), function (writeErr) {
            if (writeErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Signup failed');
            }
            res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: 'User created', user: newUser }));
        });
    });
});



// ====================== GET USER ======================
app.get('getuser', function (request, response) {
    const items = request.url.split('/');
    const userId = items[2];

    readFile('db.json', function (readErr, fileData) {
        if (readErr) {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('read error');
        }

        let parsed;
        try {
            parsed = JSON.parse(fileData);
        } catch {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('invalid json');
        }

        const users = Array.isArray(parsed) ? parsed : (parsed.users || []);
        const user = users.find(x => String(x.id) === userId);

        if (user) {
            response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return response.end(JSON.stringify(user));
        } else {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('user not found');
        }
    });
});


// ====================== DELETE USER ======================


app.get('deleteuser', function (request, response) {

    const items = request.url.split('/');
    const userId = items[2];

    console.log('User ID:', userId);

    readFile('db.json', 'utf8', function (err, data) {

        if (err) {
            console.log(err);
            response.writeHead(500);
            return response.end('read error');
        }

        let parsed;

        try {
            parsed = JSON.parse(data);
        }
        catch (e) {
            response.writeHead(500);
            return response.end('invalid json');
        }

        const users = parsed.users;

        const index = users.findIndex(function(user) {
            return String(user.id) === String(userId);
        });

        console.log('User index:', index);

        if (index === -1) {
            response.writeHead(404);
            return response.end('user not found');
        }

        users.splice(index, 1);

        writeFile('db.json', JSON.stringify(parsed, null, 2), function(err) {

            if (err) {
                console.log(err);
                response.writeHead(500);
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







app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});