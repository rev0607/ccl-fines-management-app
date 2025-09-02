import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fineReasons, users } from '@/db/schema';
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

    let query = db.select({
      id: fineReasons.id,
      name: fineReasons.reason,
      defaultAmount: fineReasons.defaultAmount,
      createdAt: fineReasons.createdAt,
      updatedAt: fineReasons.updatedAt,
      deletedAt: fineReasons.deletedAt
    }).from(fineReasons);

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

    const results = await query
      .orderBy(desc(fineReasons.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET fine-reasons error:', error);
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
    
    // Only admin and superadmin can add fine reasons
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin and superadmin can add fine reasons.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const requestBody = await request.json();
    const { reason, default_amount } = requestBody;

    // Security check: reject if user ID fields provided
    if ('userId' in requestBody || 'user_id' in requestBody || 'addedByUserId' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!reason) {
      return NextResponse.json({ 
        error: "Reason is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    if (default_amount === undefined || default_amount === null) {
      return NextResponse.json({ 
        error: "Default amount is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate reason length
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      return NextResponse.json({ 
        error: "Reason must be at least 3 characters long",
        code: "INVALID_REASON_LENGTH" 
      }, { status: 400 });
    }

    if (trimmedReason.length > 200) {
      return NextResponse.json({ 
        error: "Reason must not exceed 200 characters",
        code: "INVALID_REASON_LENGTH" 
      }, { status: 400 });
    }

    // Validate default_amount
    const amount = parseFloat(default_amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ 
        error: "Default amount must be a valid number greater than or equal to 0",
        code: "INVALID_DEFAULT_AMOUNT" 
      }, { status: 400 });
    }

    const currentTime = new Date().toISOString();
    const insertData = {
      reason: trimmedReason,
      defaultAmount: amount,
      createdAt: currentTime,
      updatedAt: currentTime,
      deletedAt: null
    };

    const newFineReason = await db.insert(fineReasons)
      .values(insertData)
      .returning();

    return NextResponse.json(newFineReason[0], { status: 201 });
  } catch (error) {
    console.error('POST fine-reasons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}