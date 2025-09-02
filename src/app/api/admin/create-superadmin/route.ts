import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long",
        code: "PASSWORD_TOO_SHORT" 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['viewer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: "Invalid role. Must be viewer, admin, or superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    const currentTime = new Date().toISOString();

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Check if user exists in better-auth user table
    const existingAuthUser = await db.select({
      id: user.id,
      email: user.email
    })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    // If user exists in better-auth, delete to recreate with updated password
    if (existingAuthUser.length > 0) {
      await db.delete(user).where(eq(user.id, existingAuthUser[0].id));
    }

    // Create user in better-auth user table using auth.api.signUpEmail
    let authUser;
    try {
      const signUpResult = await auth.api.signUpEmail({
        body: {
          name: trimmedName,
          email: normalizedEmail,
          password: password
        }
      });

      if (!signUpResult || !signUpResult.user) {
        throw new Error('Failed to create auth user');
      }

      authUser = signUpResult.user;
    } catch (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json({ 
        error: 'Failed to create authentication user: ' + authError,
        code: 'AUTH_SIGNUP_FAILED'
      }, { status: 500 });
    }

    // Check if user exists in legacy users table
    const existingLegacyUser = await db.select({
      id: users.id,
      email: users.email
    })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    let legacyUser;

    if (existingLegacyUser.length > 0) {
      // Update existing legacy user
      const updated = await db.update(users)
        .set({
          name: trimmedName,
          passwordHash: passwordHash,
          role: role,
          updatedAt: currentTime
        })
        .where(eq(users.id, existingLegacyUser[0].id))
        .returning();

      if (updated.length === 0) {
        return NextResponse.json({ 
          error: 'Failed to update legacy user',
          code: 'UPDATE_FAILED'
        }, { status: 500 });
      }

      legacyUser = updated[0];
    } else {
      // Create new legacy user
      const created = await db.insert(users)
        .values({
          name: trimmedName,
          email: normalizedEmail,
          passwordHash: passwordHash,
          role: role,
          createdAt: currentTime,
          updatedAt: currentTime
        })
        .returning();

      if (created.length === 0) {
        return NextResponse.json({ 
          error: 'Failed to create legacy user',
          code: 'CREATE_FAILED'
        }, { status: 500 });
      }

      legacyUser = created[0];
    }

    // Remove passwordHash from response for security
    const { passwordHash: _, ...userResponse } = legacyUser;

    return NextResponse.json({
      message: 'Super admin user created/updated successfully',
      user: {
        ...userResponse,
        authUserId: authUser.id
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}