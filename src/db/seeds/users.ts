import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const saltRounds = 10;
    const currentTime = new Date().toISOString();

    const sampleUsers = [
        {
            name: 'Super Administrator',
            email: 'admin@cclfines.com',
            passwordHash: await bcrypt.hash('admin123', saltRounds),
            avatarUrl: null,
            role: 'superadmin',
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
        },
        {
            name: 'Admin User',
            email: 'admin@test.com',
            passwordHash: await bcrypt.hash('password123', saltRounds),
            avatarUrl: null,
            role: 'admin',
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
        },
        {
            name: 'John Viewer',
            email: 'viewer1@test.com',
            passwordHash: await bcrypt.hash('password123', saltRounds),
            avatarUrl: null,
            role: 'viewer',
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
        },
        {
            name: 'Sarah Viewer',
            email: 'viewer2@test.com',
            passwordHash: await bcrypt.hash('password123', saltRounds),
            avatarUrl: null,
            role: 'viewer',
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
        },
        {
            name: 'Team Manager',
            email: 'manager@cclfines.com',
            passwordHash: await bcrypt.hash('manager123', saltRounds),
            avatarUrl: null,
            role: 'admin',
            createdAt: currentTime,
            updatedAt: currentTime,
            deletedAt: null,
        },
    ];

    await db.delete(users);
    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});