const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Available Prisma client methods:');
console.log(Object.getOwnPropertyNames(prisma).filter(name => !name.startsWith('_') && !name.startsWith('$')));
