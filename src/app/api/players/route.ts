import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { players, users } from '@/db/schema';
import { eq, like, and, isNull, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    let query = db.select().from(players)
      .orderBy(desc(players.createdAt));

    const conditions = [];

    // Only include deleted players if specifically requested
    if (!includeDeleted) {
      conditions.push(isNull(players.deletedAt));
    }

    if (search) {
      conditions.push(like(players.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET players error:', error);
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
    
    // Only admin and superadmin can add players
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin and superadmin can add players.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const requestBody = await request.json();
    const { name } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate name length
    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ 
        error: "Name must be at least 2 characters long",
        code: "INVALID_NAME_LENGTH" 
      }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ 
        error: "Name must be no more than 100 characters long",
        code: "INVALID_NAME_LENGTH" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData = {
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    const newPlayer = await db.insert(players)
      .values(insertData)
      .returning();

    return NextResponse.json(newPlayer[0], { status: 201 });
  } catch (error) {
    console.error('POST players error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}