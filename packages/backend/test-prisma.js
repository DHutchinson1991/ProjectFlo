const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('Available Prisma models:');
console.log(Object.keys(prisma).filter(key => !key.startsWith('$')));
