import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization header missing or invalid',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Parse user ID from token (format: user_${userId}_${timestamp})
    const tokenParts = token.split('_');
    if (tokenParts.length !== 3 || tokenParts[0] !== 'user') {
      return NextResponse.json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const currentUserId = parseInt(tokenParts[1]);
    if (isNaN(currentUserId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID in token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    // Find current user by ID where deleted_at is null (not soft deleted)
    const currentUser = await db.select()
      .from(users)
      .where(and(
        eq(users.id, currentUserId),
        isNull(users.deletedAt)
      ))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    // Check if current user is superadmin
    if (currentUser[0].role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only superadmin can manage users.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, isActive } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, email, role',
        code: 'MISSING_FIELDS' 
      }, { status: 400 });
    }

    // Validate role
    if (!['viewer', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be viewer, admin, or superadmin',
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const updatedUser = await db.update(users)
        .set({
          name,
          role,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();

      const { passwordHash, ...userData } = updatedUser[0];
      
      return NextResponse.json({
        message: 'User updated successfully',
        user: userData
      }, { status: 200 });
    } else {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newUser = await db.insert(users)
        .values({
          name,
          email,
          passwordHash: hashedPassword,
          role,
          isActive: isActive !== undefined ? isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const { passwordHash, ...userData } = newUser[0];
      
      return NextResponse.json({
        message: 'User created successfully',
        user: userData,
        tempPassword // Only returned on creation
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error('POST upsert user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}