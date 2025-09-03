import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        error: 'Insufficient permissions. Only superadmin can change user roles.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['viewer', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be viewer, admin, or superadmin',
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    // Check if target user exists and is not deleted
    const targetUser = await db.select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        isNull(users.deletedAt)
      ))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ 
        error: 'Target user not found or inactive',
        code: 'TARGET_USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prevent superadmin from demoting themselves
    if (currentUserId === userId && role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Cannot change your own superadmin role',
        code: 'CANNOT_DEMOTE_SELF' 
      }, { status: 400 });
    }

    // Update user role
    const updatedUser = await db.update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    const { passwordHash, ...userData } = updatedUser[0];
    
    return NextResponse.json({
      message: 'User role updated successfully',
      user: userData
    }, { status: 200 });
    
  } catch (error) {
    console.error('PUT user role error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}