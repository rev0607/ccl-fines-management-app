import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            id: 'user_admin_cclfines_001',
            email: 'admin@cclfines.com',
            name: 'Super Administrator',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'user_admin_test_001',
            email: 'admin@test.com',
            name: 'Admin User',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'user_viewer_001',
            email: 'viewer1@test.com',
            name: 'John Viewer',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'user_viewer_002',
            email: 'viewer2@test.com',
            name: 'Sarah Viewer',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'user_manager_001',
            email: 'manager@cclfines.com',
            name: 'Team Manager',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ Better-auth users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});