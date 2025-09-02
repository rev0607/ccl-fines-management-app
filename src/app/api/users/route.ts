import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, and, or, desc, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Validate session and check permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get user from database to check role
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
    
    // Only superadmin can view all users
    if (user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only superadmin can view users.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Search and filter parameters
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    
    // Validate role parameter if provided
    if (role && !['viewer', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ 
        error: "Invalid role. Must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Build the base query - exclude soft deleted users and password hash
    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);

    // Base condition: exclude soft deleted users
    let whereConditions = [isNull(users.deletedAt)];

    // Add search condition if provided
    if (search) {
      const searchCondition = or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      );
      whereConditions.push(searchCondition);
    }

    // Add role filter if provided
    if (role) {
      whereConditions.push(eq(users.role, role));
    }

    // Apply all conditions
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Execute the main query with pagination and ordering
    const results = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate session and check permissions
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get user from database to check role
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
    
    // Only superadmin can create users
    if (user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only superadmin can create users.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, passwordHash, avatarUrl, role } = body;

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

    if (!passwordHash) {
      return NextResponse.json({ 
        error: "Password hash is required",
        code: "MISSING_PASSWORD_HASH" 
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

    // Validate role if provided
    if (role && !['viewer', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ 
        error: "Invalid role. Must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      avatarUrl: avatarUrl?.trim() || null,
      role: role || 'viewer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert new user
    const newUser = await db.insert(users)
      .values(insertData)
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return NextResponse.json(newUser[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, passwordHash, avatarUrl, role } = body;

    // Validate role if provided
    if (role && !['viewer', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ 
        error: "Invalid role. Must be one of: viewer, admin, superadmin",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
    }

    // Check if user exists and is not soft deleted
    const existingUser = await db.select()
      .from(users)
      .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if email already exists for another user
    if (email) {
      const emailExists = await db.select()
        .from(users)
        .where(and(
          eq(users.email, email.toLowerCase()),
          isNull(users.deletedAt),
          eq(users.id, parseInt(id))
        ))
        .limit(1);

      if (emailExists.length === 0) {
        const otherUserWithEmail = await db.select()
          .from(users)
          .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
          .limit(1);
        
        if (otherUserWithEmail.length > 0) {
          return NextResponse.json({ 
            error: "Email already exists",
            code: "EMAIL_EXISTS" 
          }, { status: 400 });
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (passwordHash !== undefined) updateData.passwordHash = passwordHash;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl?.trim() || null;
    if (role !== undefined) updateData.role = role;

    // Update user
    const updatedUser = await db.update(users)
      .set(updateData)
      .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0]);

  } catch (error) {
    console.error('PUT /api/users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists and is not already soft deleted
    const existingUser = await db.select()
      .from(users)
      .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Soft delete user by setting deletedAt timestamp
    const deletedUser = await db.update(users)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(users.id, parseInt(id)), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    if (deletedUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      user: deletedUser[0]
    });

  } catch (error) {
    console.error('DELETE /api/users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}