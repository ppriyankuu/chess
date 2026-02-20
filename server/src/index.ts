import { initServer } from './server';

const PORT = process.env.PORT || 8080;

initServer(Number(PORT));