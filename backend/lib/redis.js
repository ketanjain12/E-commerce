import Redis from "ioredis"
import  dotenv  from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_API);

await redis.set('foo', 'bar'); // key = foo and value = far  // npm .\backend\lib\redis.js for the run redis command 

// //note : redis is a key / value store(giant store ) there are diff data structures such as lists hashes sets sorted sets 
// strings and sets 

// value like refresh token with user id as the key 
// original
// import Redis from "ioredis"
// const client = new Redis("rediss://default:ATlZAAIjcDExNDI3ZTJjYmQ2OGI0M2YyYWQ4MWQxYWRmZmRjN2ZkZHAxMA@charming-doberman-14681.upstash.io:6379");
// await client.set('foo', 'bar');


// for Linux
// node backend/lib/redis.js

// for window
// node .\backend\lib\redis.js   

