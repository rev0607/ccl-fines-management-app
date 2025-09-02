import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Input validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ 
        error: "Name must be at least 2 characters long",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ 
        error: "Valid email address is required",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long",
        code: "INVALID_PASSWORD" 
      }, { status: 400 });
    }

    if (!role || !['viewer', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ 
        error: "Role must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    // Check for existing user in both tables
    const existingBetterAuthUser = await db.select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    const existingLegacyUser = await db.select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingBetterAuthUser.length > 0 || existingLegacyUser.length > 0) {
      return NextResponse.json({ 
        error: "User with this email already exists",
        code: "EMAIL_CONFLICT" 
      }, { status: 409 });
    }

    // Hash password for legacy users table
    const passwordHash = await bcrypt.hash(password, 12);

    // Start transaction to create both users
    const currentTime = new Date().toISOString();
    
    // Create user in better-auth user table using auth library
    let betterAuthUser;
    try {
      betterAuthUser = await auth.api.signUpEmail({
        body: {
          name: trimmedName,
          email: normalizedEmail,
          password: password,
        },
      });
    } catch (authError) {
      console.error('Better-auth user creation error:', authError);
      return NextResponse.json({ 
        error: "Failed to create authentication user",
        code: "AUTH_CREATION_FAILED" 
      }, { status: 500 });
    }

    // Create user in legacy users table
    const legacyUser = await db.insert(users)
      .values({
        name: trimmedName,
        email: normalizedEmail,
        passwordHash: passwordHash,
        role: role,
        createdAt: currentTime,
        updatedAt: currentTime
      })
      .returning();

    if (legacyUser.length === 0) {
      // Rollback: delete better-auth user if legacy user creation fails
      try {
        await db.delete(user).where(eq(user.email, normalizedEmail));
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      
      return NextResponse.json({ 
        error: "Failed to create legacy user record",
        code: "LEGACY_USER_CREATION_FAILED" 
      }, { status: 500 });
    }

    // Return success response with both user IDs
    return NextResponse.json({
      message: "User successfully synchronized between both systems",
      betterAuthUserId: betterAuthUser.user.id,
      legacyUserId: legacyUser[0].id,
      user: {
        name: legacyUser[0].name,
        email: legacyUser[0].email,
        role: legacyUser[0].role,
        createdAt: legacyUser[0].createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}