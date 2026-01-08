import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const host = process.env.REDIS_HOST || 'localhost';
  const password = process.env.REDIS_PASSWORD;

  // Forzar TLS si hay password o si el host es de Upstash
  const useTls = !!(password || host.includes('upstash') || host.includes('redis.cloud'));

  console.log(`[RedisConfig] Host: ${host}, TLS: ${useTls}, Has Password: ${!!password}`);

  return {
    host,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password,
    tls: useTls,
  };
});
