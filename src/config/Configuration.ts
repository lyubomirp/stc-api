import * as process from 'node:process';

const toPort = (
  value: string | undefined,
  fallback: number,
): number => Number.parseInt(value ?? '', 10) || fallback;

export default () => ({
  port: toPort(process.env.PORT, 3000),
  database: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: toPort(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  api: {
    url: process.env.API_URL,
  },
});
