
import http from 'http';
import { registerControllers, UseApiControllers } from './utils/RegisterControllers.ts';

const PORT = process.env.PORT || 3000;

const server = http.createServer();

server.on('request', UseApiControllers)

server.listen(PORT, async () => {
  await registerControllers();
  console.log(`Server is running on port http://localhost:${PORT}`);
});