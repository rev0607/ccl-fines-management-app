import { db } from '@/db';
import { players, fineReasons, settings } from '@/db/schema';

async function main() {
    const currentDate = new Date().toISOString();
    
    // Players data
    const samplePlayers = [
        {
            name: 'Virat Kohli',
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
            deletedAt: null,
        },
        {
            name: 'MS Dhoni',
            createdAt: new Date('2024-01-02').toISOString(),
            updatedAt: new Date('2024-01-02').toISOString(),
            deletedAt: null,
        },
        {
            name: 'Rohit Sharma',
            createdAt: new Date('2024-01-03').toISOString(),
            updatedAt: new Date('2024-01-03').toISOString(),
            deletedAt: null,
        },
        {
            name: 'KL Rahul',
            createdAt: new Date('2024-01-04').toISOString(),
            updatedAt: new Date('2024-01-04').toISOString(),
            deletedAt: null,
        },
        {
            name: 'Hardik Pandya',
            createdAt: new Date('2024-01-05').toISOString(),
            updatedAt: new Date('2024-01-05').toISOString(),
            deletedAt: null,
        }
    ];

    // Fine reasons data
    const sampleFineReasons = [
        {
            reason: 'Late Arrival',
            defaultAmount: 50.0,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
            deletedAt: null,
        },
        {
            reason: 'Missing Practice',
            defaultAmount: 100.0,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
            deletedAt: null,
        },
        {
            reason: 'Uniform Violation',
            defaultAmount: 25.0,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
            deletedAt: null,
        },
        {
            reason: 'Unsporting Behavior',
            defaultAmount: 200.0,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
            deletedAt: null,
        }
    ];

    // Settings data
    const sampleSettings = [
        {
            settingKey: 'currency',
            settingValue: '₹',
            updatedByUserId: 1,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
        },
        {
            settingKey: 'fine_frequency',
            settingValue: 'match',
            updatedByUserId: 1,
            createdAt: new Date('2024-01-01').toISOString(),
            updatedAt: new Date('2024-01-01').toISOString(),
        }
    ];

    // Insert all data
    await db.insert(players).values(samplePlayers);
    await db.insert(fineReasons).values(sampleFineReasons);
    await db.insert(settings).values(sampleSettings);
    
    console.log('✅ Basic data seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});