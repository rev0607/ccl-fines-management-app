import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        error: "Name is required",
        code: "MISSING_NAME"
      }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({
        error: "Email is required",
        code: "MISSING_EMAIL"
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({
        error: "Password is required",
        code: "MISSING_PASSWORD"
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({
        error: "Role is required",
        code: "MISSING_ROLE"
      }, { status: 400 });
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json({
        error: "Name must be at least 2 characters long",
        code: "INVALID_NAME_LENGTH"
      }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({
        error: "Name must not exceed 100 characters",
        code: "INVALID_NAME_LENGTH"
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT"
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        error: "Password must be at least 6 characters long",
        code: "INVALID_PASSWORD_LENGTH"
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['viewer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        error: "Role must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE"
      }, { status: 400 });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    // Check if user exists in better-auth user table
    const existingBetterAuthUser = await db.select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (existingBetterAuthUser.length > 0) {
      return NextResponse.json({
        error: "User with this email already exists",
        code: "EMAIL_ALREADY_EXISTS"
      }, { status: 400 });
    }

    // Check if user exists in legacy users table
    const existingLegacyUser = await db.select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingLegacyUser.length > 0) {
      return NextResponse.json({
        error: "User with this email already exists",
        code: "EMAIL_ALREADY_EXISTS"
      }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const currentTimestamp = new Date().toISOString();

    let betterAuthUser;
    let legacyUser;

    try {
      // Create user in better-auth user table using auth.api.signUpEmail
      const signUpResult = await auth.api.signUpEmail({
        body: {
          name: trimmedName,
          email: normalizedEmail,
          password: password
        }
      });

      if (!signUpResult || !signUpResult.user) {
        throw new Error('Failed to create user in better-auth system');
      }

      betterAuthUser = signUpResult.user;

      // Create user in legacy users table
      const newLegacyUser = await db.insert(users)
        .values({
          name: trimmedName,
          email: normalizedEmail,
          passwordHash: passwordHash,
          role: role,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .returning();

      if (newLegacyUser.length === 0) {
        throw new Error('Failed to create user in legacy users table');
      }

      legacyUser = newLegacyUser[0];

    } catch (error) {
      // Rollback: if better-auth user was created but legacy user failed
      if (betterAuthUser) {
        try {
          // Attempt to delete the better-auth user
          // Note: better-auth may not provide a direct delete API, 
          // this would need to be implemented based on your auth setup
          await db.delete(user).where(eq(user.id, betterAuthUser.id));
        } catch (rollbackError) {
          console.error('Failed to rollback better-auth user creation:', rollbackError);
        }
      }

      // Rollback: if legacy user was created but better-auth user failed
      if (legacyUser) {
        try {
          await db.delete(users).where(eq(users.id, legacyUser.id));
        } catch (rollbackError) {
          console.error('Failed to rollback legacy user creation:', rollbackError);
        }
      }

      console.error('User creation error:', error);
      return NextResponse.json({
        error: 'Failed to create user: ' + error,
        code: "USER_CREATION_FAILED"
      }, { status: 500 });
    }

    // Return success response with both user IDs (exclude passwordHash for security)
    const { passwordHash: _, ...legacyUserResponse } = legacyUser;

    return NextResponse.json({
      message: "User created successfully",
      betterAuthUser: {
        id: betterAuthUser.id,
        name: betterAuthUser.name,
        email: betterAuthUser.email,
        emailVerified: betterAuthUser.emailVerified,
        createdAt: betterAuthUser.createdAt,
        updatedAt: betterAuthUser.updatedAt
      },
      legacyUser: legacyUserResponse
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}