import { createConnection } from 'typeorm';

// (async () => await createConnection())();

export default async () => await createConnection();
