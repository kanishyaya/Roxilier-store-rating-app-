import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Password@123'; // same login password for every seeded account

async function hash(pw) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log('Seeding...');

  // ── Admin ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'System Administrator Master Account',
      email: 'admin@example.com',
      address: 'HQ, Store Rating Platform',
      password: await hash(PASSWORD),
      role: 'ADMIN',
    },
  });

  // ── Normal users ───────────────────────────────────────────────────────────
  const userDefs = [
    { name: 'Ananya Priyanka Krishnamurthy', email: 'ananya.k@example.com', address: '14, MG Road, Bengaluru' },
    { name: 'Rohan Vikram Deshmukh Senior', email: 'rohan.deshmukh@example.com', address: '22, FC Road, Pune' },
    { name: 'Meera Lakshmi Venkataraman', email: 'meera.venkat@example.com', address: '5, Anna Salai, Chennai' },
    { name: 'Farhan Ahmed Siddiqui Junior', email: 'farhan.siddiqui@example.com', address: '9, Park Street, Kolkata' },
    { name: 'Kavya Nandini Subramaniam', email: 'kavya.subra@example.com', address: '31, Linking Road, Mumbai' },
  ];

  const users = [];
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: await hash(PASSWORD), role: 'USER' },
    });
    users.push(user);
  }

  // ── Store owners + their stores ────────────────────────────────────────────
  const ownerDefs = [
    {
      name: 'Suresh Chandra Balasubramaniam',
      email: 'suresh.owner@example.com',
      address: '2, Residency Road, Bengaluru',
      store: { name: 'Spice Garden Restaurant', email: 'contact@spicegarden.example.com', address: '2, Residency Road, Bengaluru' },
    },
    {
      name: 'Priya Ramachandran Iyer',
      email: 'priya.owner@example.com',
      address: '18, Koregaon Park, Pune',
      store: { name: 'Urban Threads Boutique', email: 'hello@urbanthreads.example.com', address: '18, Koregaon Park, Pune' },
    },
    {
      name: 'Vikas Narayan Pillai',
      email: 'vikas.owner@example.com',
      address: '7, T Nagar, Chennai',
      store: { name: 'TechHub Electronics', email: 'support@techhub.example.com', address: '7, T Nagar, Chennai' },
    },
    {
      name: 'Divya Shankar Menon',
      email: 'divya.owner@example.com',
      address: '44, Bandra West, Mumbai',
      store: { name: 'Green Leaf Organic Store', email: 'info@greenleaf.example.com', address: '44, Bandra West, Mumbai' },
    },
  ];

  const stores = [];
  for (const o of ownerDefs) {
    const owner = await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: { name: o.name, email: o.email, address: o.address, password: await hash(PASSWORD), role: 'OWNER' },
    });

    const store = await prisma.store.upsert({
      where: { ownerId: owner.id },
      update: {},
      create: { ...o.store, ownerId: owner.id },
    });
    stores.push(store);
  }

  // ── Ratings (spread across users × stores, skipping some pairs) ────────────
  const scores = [5, 4, 3, 5, 2, 4, 5, 3, 4, 5, 1, 4];
  let i = 0;
  for (const user of users) {
    for (const store of stores) {
      if ((i + stores.indexOf(store)) % 3 === 0) continue;
      const score = scores[i % scores.length];
      await prisma.rating.upsert({
        where: { userId_storeId: { userId: user.id, storeId: store.id } },
        update: { score },
        create: { userId: user.id, storeId: store.id, score },
      });
      i++;
    }
  }

  const counts = {
    users: await prisma.user.count(),
    stores: await prisma.store.count(),
    ratings: await prisma.rating.count(),
  };
  console.log('Done. Current totals:', counts);
  console.log(`\nAll seeded accounts use the password: ${PASSWORD}`);
  console.log('Admin login:  admin@example.com');
  console.log('Owner login:  suresh.owner@example.com  (and 3 others)');
  console.log('User login:   ananya.k@example.com      (and 4 others)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
