import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session and check permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get current user from database to check role
    const currentUser = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const user = currentUser[0];
    
    // Only superadmin can change user roles
    if (user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only superadmin can change user roles.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const { id } = params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid user ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }
    
    const userId = parseInt(id);
    
    // Parse request body
    const { role } = await request.json();
    
    // Validate role is provided
    if (!role) {
      return NextResponse.json({ 
        error: "Role is required",
        code: "MISSING_ROLE" 
      }, { status: 400 });
    }
    
    // Validate role value
    const validRoles = ['viewer', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: "Role must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }
    
    // Check if user exists and is not soft deleted
    const existingUser = await db.select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    
    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found or has been deleted' 
      }, { status: 404 });
    }
    
    // Prevent changing own role to prevent lockout
    if (userId === user.id && role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Cannot change your own superadmin role to prevent system lockout',
        code: 'CANNOT_CHANGE_OWN_ROLE' 
      }, { status: 400 });
    }
    
    // Update user role
    const updated = await db.update(users)
      .set({
        role,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'User not found or has been deleted' 
      }, { status: 404 });
    }
    
    // Return updated user excluding password_hash
    const { passwordHash, ...userWithoutPassword } = updated[0];
    
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('PUT /api/users/[id]/role error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}