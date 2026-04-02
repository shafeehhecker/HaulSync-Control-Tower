import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Control Tower database…');

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { name:'Admin User',    email:'admin@haulsync.local',      password:'Admin@1234',  role:'SUPER_ADMIN'           },
    { name:'CT Manager',    email:'ct-manager@haulsync.local', password:'CTMgr@1234',  role:'CONTROL_TOWER_MANAGER' },
    { name:'Ops Operator',  email:'operator@haulsync.local',   password:'Ops@1234',    role:'OPERATOR'              },
    { name:'Viewer',        email:'viewer@haulsync.local',     password:'View@1234',   role:'VIEWER'                },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashed, role: u.role },
    });
  }
  console.log(`  ✓ ${users.length} users`);

  // ── Alert Rules ────────────────────────────────────────────────────────────
  const rules = [
    {
      exceptionType: 'UNPLANNED_HALT',
      source: '*',
      triggerAfterMinutes: 30,
      notifyRoles: ['OPERATOR'],
      escalateAfterMinutes: 60,
      escalateToRoles: ['CONTROL_TOWER_MANAGER'],
      channels: ['IN_APP', 'EMAIL'],
      autoResolveOnMovement: true,
    },
    {
      exceptionType: 'ROUTE_DEVIATION',
      source: '*',
      triggerAfterMinutes: 0,
      notifyRoles: ['OPERATOR'],
      escalateAfterMinutes: 30,
      escalateToRoles: ['CONTROL_TOWER_MANAGER'],
      channels: ['IN_APP'],
      autoResolveOnMovement: false,
    },
    {
      exceptionType: 'SLA_BREACH_RISK',
      source: '*',
      triggerAfterMinutes: 0,
      notifyRoles: ['CONTROL_TOWER_MANAGER'],
      escalateAfterMinutes: 30,
      escalateToRoles: ['ADMIN'],
      channels: ['IN_APP', 'EMAIL'],
      autoResolveOnMovement: false,
    },
    {
      exceptionType: 'DELAY_RISK',
      source: '*',
      triggerAfterMinutes: 60,
      notifyRoles: ['OPERATOR'],
      escalateAfterMinutes: 90,
      escalateToRoles: ['CONTROL_TOWER_MANAGER'],
      channels: ['EMAIL'],
      autoResolveOnMovement: false,
    },
    {
      exceptionType: 'NIGHT_DRIVING',
      source: '*',
      triggerAfterMinutes: 0,
      notifyRoles: ['OPERATOR'],
      escalateAfterMinutes: 0,
      escalateToRoles: [],
      channels: ['IN_APP'],
      autoResolveOnMovement: false,
    },
  ];

  // Wipe and recreate rules so seed is idempotent on every restart
  await prisma.alertRule.deleteMany({});
  for (const rule of rules) {
    await prisma.alertRule.create({ data: rule });
  }
  console.log(`  ✓ ${rules.length} alert rules`);

  // ── Sample Shipments ───────────────────────────────────────────────────────
  const shipments = [
    {
      reference: 'HS/2024/8821',
      source: 'haulsync-ftl',
      originName: 'Mumbai',    originLat: 19.076, originLng: 72.877,
      destName: 'Delhi',       destLat: 28.613,   destLng: 77.209,
      transporterName: 'FastFreight Co',
      vehicleRegNo: 'MH-04-AB-1234',
      status: 'HALTED',
      slaDeadline: new Date(Date.now() + 30 * 60 * 1000),
    },
    {
      reference: 'HS/2024/8799',
      source: 'haulsync-ftl',
      originName: 'Pune',      originLat: 18.520, originLng: 73.856,
      destName: 'Nagpur',      destLat: 21.145,   destLng: 79.088,
      transporterName: 'NorthLine Ltd',
      vehicleRegNo: 'MH-12-CD-5678',
      status: 'DELAYED',
      slaDeadline: new Date(Date.now() + 90 * 60 * 1000),
    },
    {
      reference: 'HS/2024/8834',
      source: 'haulsync-ftl',
      originName: 'Chennai',   originLat: 13.082, originLng: 80.270,
      destName: 'Bangalore',   destLat: 12.971,   destLng: 77.594,
      transporterName: 'Atlas Haulage',
      vehicleRegNo: 'TN-09-EF-9012',
      status: 'IN_TRANSIT',
      slaDeadline: new Date(Date.now() + 120 * 60 * 1000),
    },
  ];

  for (const s of shipments) {
    await prisma.shipment.upsert({
      where: { reference: s.reference },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${shipments.length} sample shipments`);

  console.log('✅ Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
