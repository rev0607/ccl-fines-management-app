import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, user } from '@/db/schema';
import { isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Query better-auth users table
    const betterAuthUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }).from(user);

    // Query legacy users table (exclude soft deleted)
    const legacyUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(isNull(users.deletedAt));

    // Create maps for efficient comparison
    const betterAuthByEmail = new Map(betterAuthUsers.map(u => [u.email.toLowerCase(), u]));
    const legacyByEmail = new Map(legacyUsers.map(u => [u.email.toLowerCase(), u]));

    // Find name consistency issues
    const nameConsistencyIssues = [];
    for (const [email, betterAuthUser] of betterAuthByEmail) {
      const legacyUser = legacyByEmail.get(email);
      if (legacyUser && betterAuthUser.name !== legacyUser.name) {
        nameConsistencyIssues.push({
          email,
          betterAuthName: betterAuthUser.name,
          legacyName: legacyUser.name,
          betterAuthId: betterAuthUser.id,
          legacyId: legacyUser.id,
          betterAuthCreatedAt: betterAuthUser.createdAt,
          legacyCreatedAt: legacyUser.createdAt
        });
      }
    }

    // Find orphaned users
    const orphanedUsers = {
      onlyInBetterAuth: [],
      onlyInLegacy: []
    };

    // Users only in better-auth
    for (const [email, betterAuthUser] of betterAuthByEmail) {
      if (!legacyByEmail.has(email)) {
        orphanedUsers.onlyInBetterAuth.push({
          id: betterAuthUser.id,
          name: betterAuthUser.name,
          email: betterAuthUser.email,
          emailVerified: betterAuthUser.emailVerified,
          createdAt: betterAuthUser.createdAt
        });
      }
    }

    // Users only in legacy
    for (const [email, legacyUser] of legacyByEmail) {
      if (!betterAuthByEmail.has(email)) {
        orphanedUsers.onlyInLegacy.push({
          id: legacyUser.id,
          name: legacyUser.name,
          email: legacyUser.email,
          role: legacyUser.role,
          createdAt: legacyUser.createdAt
        });
      }
    }

    // Prepare comprehensive report
    const report = {
      summary: {
        betterAuthUsersCount: betterAuthUsers.length,
        legacyUsersCount: legacyUsers.length,
        nameConsistencyIssuesCount: nameConsistencyIssues.length,
        orphanedUsersCount: orphanedUsers.onlyInBetterAuth.length + orphanedUsers.onlyInLegacy.length,
        reportGeneratedAt: new Date().toISOString()
      },
      betterAuthUsers: betterAuthUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      legacyUsers: legacyUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      })),
      nameConsistencyIssues,
      orphanedUsers
    };

    return NextResponse.json(report, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
}