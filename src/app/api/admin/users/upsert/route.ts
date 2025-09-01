import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, role, avatarUrl } = body;

    // Validation
    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }

    // Name validation
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json({ 
        error: "Name must be at least 2 characters long",
        code: "NAME_TOO_SHORT" 
      }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ 
        error: "Name cannot exceed 100 characters",
        code: "NAME_TOO_LONG" 
      }, { status: 400 });
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long",
        code: "PASSWORD_TOO_SHORT" 
      }, { status: 400 });
    }

    // Role validation
    const validRoles = ['viewer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: "Role must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedAvatarUrl = avatarUrl ? avatarUrl.trim() : null;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if user exists (excluding soft deleted users)
    const existingUser = await db.select()
      .from(users)
      .where(and(eq(users.email, normalizedEmail), isNull(users.deletedAt)))
      .limit(1);

    const currentTimestamp = new Date().toISOString();

    let result;
    let isUpdate = false;

    if (existingUser.length > 0) {
      // Update existing user
      isUpdate = true;
      const updated = await db.update(users)
        .set({
          name: trimmedName,
          passwordHash,
          role,
          avatarUrl: sanitizedAvatarUrl,
          updatedAt: currentTimestamp,
          deletedAt: null // Restore if it was soft deleted
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();

      result = updated[0];
    } else {
      // Create new user
      const inserted = await db.insert(users)
        .values({
          name: trimmedName,
          email: normalizedEmail,
          passwordHash,
          role,
          avatarUrl: sanitizedAvatarUrl,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
          deletedAt: null
        })
        .returning();

      result = inserted[0];
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...userResponse } = result;

    return NextResponse.json({
      user: userResponse,
      message: isUpdate ? 'User updated successfully' : 'User created successfully'
    }, { status: isUpdate ? 200 : 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}