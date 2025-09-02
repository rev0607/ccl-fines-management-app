import { db } from '@/db';
import { user, users, session, account, verification } from '@/db/schema';

async function main() {
    try {
        // Delete all records from better-auth tables
        await db.delete(verification);
        console.log('✅ Cleared verification table');
        
        await db.delete(account);
        console.log('✅ Cleared account table');
        
        await db.delete(session);
        console.log('✅ Cleared session table');
        
        await db.delete(user);
        console.log('✅ Cleared user table (better-auth)');
        
        // Delete all records from legacy users table
        await db.delete(users);
        console.log('✅ Cleared users table (legacy)');
        
        // Reset SQLite sequences for auto-increment tables
        await db.run(`DELETE FROM sqlite_sequence WHERE name IN ('users')`);
        console.log('✅ Reset auto-increment sequences for legacy users table');
        
        console.log('🧹 User cleanup seeder completed successfully');
        console.log('📋 Summary:');
        console.log('   - Better-auth user table: cleared');
        console.log('   - Legacy users table: cleared');
        console.log('   - All related auth sessions and accounts: cleared');
        console.log('   - Auto-increment sequences: reset');
        console.log('💡 Ready for proper user synchronization through sync API');
        
    } catch (error) {
        console.error('❌ User cleanup failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});