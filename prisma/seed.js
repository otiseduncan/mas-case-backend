import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
function parseDemoUsers() {
    try {
        const raw = process.env.DEMO_USERS_JSON;
        if (!raw || raw.trim() === '' || raw.trim() === '[]') {
            return [
                { email: 'admin@masdemo.com', password: 'Admin!234', role: 'admin', org: 'MAS' },
                { email: 'manager@masdemo.com', password: 'Manager!234', role: 'manager', org: 'MAS' },
                { email: 'tech@masdemo.com', password: 'Tech!234', role: 'tech', org: 'MAS' },
            ];
        }
        const arr = JSON.parse(raw);
        return arr;
    }
    catch (e) {
        console.error('Failed to parse DEMO_USERS_JSON; falling back to defaults', e);
        return [
            { email: 'admin@masdemo.com', password: 'Admin!234', role: 'admin', org: 'MAS' },
            { email: 'manager@masdemo.com', password: 'Manager!234', role: 'manager', org: 'MAS' },
            { email: 'tech@masdemo.com', password: 'Tech!234', role: 'tech', org: 'MAS' },
        ];
    }
}
async function main() {
    const demoUsers = parseDemoUsers();
    // Create orgs
    const orgNames = Array.from(new Set(demoUsers.map(u => u.org)));
    const orgs = await Promise.all(orgNames.map(name => prisma.organization.upsert({
        where: { name },
        update: {},
        create: { name }
    })));
    // Create shops for MAS
    const mas = orgs.find(o => o.name === 'MAS') || orgs[0];
    if (mas) {
        await prisma.shop.upsert({
            where: { orgId_name: { orgId: mas.id, name: 'Gerber - Bolingbrook' } },
            update: {},
            create: { orgId: mas.id, name: 'Gerber - Bolingbrook', city: 'Bolingbrook', state: 'IL' }
        });
        await prisma.shop.upsert({
            where: { orgId_name: { orgId: mas.id, name: 'Gerber - Plainfield' } },
            update: {},
            create: { orgId: mas.id, name: 'Gerber - Plainfield', city: 'Plainfield', state: 'IL' }
        });
    }
    // Create users
    for (const u of demoUsers) {
        const org = orgs.find(o => o.name === u.org);
        const passwordHash = await bcrypt.hash(u.password, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: { orgId: org.id, role: u.role },
            create: {
                email: u.email,
                passwordHash,
                role: u.role,
                orgId: org.id,
            }
        });
    }
    // Create one sample case
    if (mas) {
        const admin = await prisma.user.findFirst({ where: { orgId: mas.id, role: 'admin' } });
        const shop = await prisma.shop.findFirst({ where: { orgId: mas.id } });
        if (admin && shop) {
            await prisma.case.upsert({
                where: { orgId_roNumber_vin: { orgId: mas.id, roNumber: 'RO12345', vin: '1HGCM82633A004352' } },
                update: {},
                create: {
                    orgId: mas.id,
                    roNumber: 'RO12345',
                    vin: '1HGCM82633A004352',
                    issueType: 'ADAS calibration',
                    status: 'new',
                    priority: 'high',
                    summary: 'Camera calibration after windshield replacement',
                    notes: 'Target board not available on arrival.',
                    shopId: shop.id,
                    createdById: admin.id
                }
            });
        }
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
