import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users, user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const email = 'suda.raghu@gmail.com';
    const name = 'Super Admin';
    const password = 'admin123';
    const role = 'superadmin';
    
    // Hash the password with salt rounds 12
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Clear any existing users with this email to avoid conflicts
    await db.delete(users).where(eq(users.email, email));
    await db.delete(user).where(eq(user.email, email));
    
    const now = new Date().toISOString();
    const timestamp = new Date();
    
    // Create user in legacy users table
    await db.insert(users).values({
        name,
        email,
        passwordHash,
        role,
        createdAt: now,
        updatedAt: now,
    });
    
    // Create user in better-auth user table
    const userId = 'user_01h4kxt2e8z9y3b1n7m6q5w8r4';
    await db.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
    });
    
    // Create account record for better-auth with password
    await db.insert(account).values({
        id: 'acc_01h4kxt2e8z9y3b1n7m6q5w8r4',
        accountId: userId,
        providerId: 'credential',
        userId,
        password: passwordHash,
        createdAt: timestamp,
        updatedAt: timestamp,
    });
    
    console.log('✅ Super admin user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});