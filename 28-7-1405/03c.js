import { createServer } from "http";

function myserver(request, response) {
  const parts = request.url.split("/").filter(Boolean);
  const first = Number(parts[0]);
  const second = Number(parts[1]);

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    response.statusCode = 400;
    response.end("لطفاً دو عدد در آدرس وارد کنید؛ مثل /10/20");
    return;
  }

  response.end(String(first + second));
}

const server = createServer(myserver);
server.listen(8080);
