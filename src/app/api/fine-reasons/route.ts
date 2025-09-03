import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fineReasons, users } from '@/db/schema';
import { eq, like, and, isNull, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    let query = db.select().from(fineReasons)
      .orderBy(desc(fineReasons.createdAt));

    const conditions = [];

    // Only include deleted fine reasons if specifically requested
    if (!includeDeleted) {
      conditions.push(isNull(fineReasons.deletedAt));
    }

    if (search) {
      conditions.push(like(fineReasons.reason, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET fine reasons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

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

    const user = currentUser[0];
    
    // Only admin and superadmin can add fine reasons
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin and superadmin can add fine reasons.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const requestBody = await request.json();
    const { reason, defaultAmount } = requestBody;

    // Validate required fields
    if (!reason) {
      return NextResponse.json({ 
        error: "Reason is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate reason length
    if (typeof reason !== 'string' || reason.trim().length < 2) {
      return NextResponse.json({ 
        error: "Reason must be at least 2 characters long",
        code: "INVALID_REASON_LENGTH" 
      }, { status: 400 });
    }

    if (reason.trim().length > 200) {
      return NextResponse.json({ 
        error: "Reason must be no more than 200 characters long",
        code: "INVALID_REASON_LENGTH" 
      }, { status: 400 });
    }

    // Validate default amount
    if (defaultAmount !== undefined && (typeof defaultAmount !== 'number' || defaultAmount < 0)) {
      return NextResponse.json({ 
        error: "Default amount must be a non-negative number",
        code: "INVALID_DEFAULT_AMOUNT" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData = {
      reason: reason.trim(),
      defaultAmount: defaultAmount || 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    const newFineReason = await db.insert(fineReasons)
      .values(insertData)
      .returning();

    return NextResponse.json(newFineReason[0], { status: 201 });
  } catch (error) {
    console.error('POST fine reasons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}