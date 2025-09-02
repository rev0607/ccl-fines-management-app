import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fines, players, fineReasons, users } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte, isNull } from 'drizzle-orm';
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

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const playerId = searchParams.get('player_id');
    const fineReasonId = searchParams.get('fine_reason_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sort = searchParams.get('sort') || 'fineDate';
    const order = searchParams.get('order') || 'desc';
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    // Build base query with JOINs
    let query = db.select({
      id: fines.id,
      playerId: fines.playerId,
      playerName: players.name,
      fineReasonId: fines.fineReasonId,
      fineReasonName: fineReasons.reason,
      amount: fines.amount,
      fineDate: fines.fineDate,
      addedById: fines.addedByUserId,
      addedByName: users.name,
      createdAt: fines.createdAt,
      updatedAt: fines.updatedAt,
      deletedAt: fines.deletedAt
    })
    .from(fines)
    .leftJoin(players, and(eq(fines.playerId, players.id), isNull(players.deletedAt)))
    .leftJoin(fineReasons, and(eq(fines.fineReasonId, fineReasons.id), isNull(fineReasons.deletedAt)))
    .leftJoin(users, eq(fines.addedByUserId, users.id));

    // Apply filters
    const conditions = [];

    // Only include deleted fines if specifically requested and user has permission
    if (!includeDeleted) {
      conditions.push(isNull(fines.deletedAt));
    }

    if (search) {
      conditions.push(
        or(
          like(players.name, `%${search}%`),
          like(fineReasons.reason, `%${search}%`)
        )
      );
    }

    if (playerId && !isNaN(parseInt(playerId))) {
      conditions.push(eq(fines.playerId, parseInt(playerId)));
    }

    if (fineReasonId && !isNaN(parseInt(fineReasonId))) {
      conditions.push(eq(fines.fineReasonId, parseInt(fineReasonId)));
    }

    if (startDate) {
      conditions.push(gte(fines.fineDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(fines.fineDate, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderFn = order === 'asc' ? asc : desc;
    switch (sort) {
      case 'playerName':
        query = query.orderBy(orderFn(players.name));
        break;
      case 'amount':
        query = query.orderBy(orderFn(fines.amount));
        break;
      case 'createdAt':
        query = query.orderBy(orderFn(fines.createdAt));
        break;
      default:
        query = query.orderBy(orderFn(fines.fineDate));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET fines error:', error);
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
    
    // Only admin and superadmin can add fines
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin and superadmin can add fines.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const requestBody = await request.json();
    const { playerId, fineReasonId, amount, fineDate } = requestBody;

    // Validate required fields
    if (!playerId || isNaN(parseInt(playerId))) {
      return NextResponse.json({ 
        error: "Valid player ID is required",
        code: "INVALID_PLAYER_ID" 
      }, { status: 400 });
    }

    if (!fineReasonId || isNaN(parseInt(fineReasonId))) {
      return NextResponse.json({ 
        error: "Valid fine reason ID is required",
        code: "INVALID_FINE_REASON_ID" 
      }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        error: "Valid positive amount is required",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (!fineDate) {
      return NextResponse.json({ 
        error: "Fine date is required",
        code: "MISSING_FINE_DATE" 
      }, { status: 400 });
    }

    // Validate that player exists and is not soft deleted
    const player = await db.select()
      .from(players)
      .where(and(eq(players.id, parseInt(playerId)), isNull(players.deletedAt)))
      .limit(1);

    if (player.length === 0) {
      return NextResponse.json({ 
        error: "Player not found",
        code: "PLAYER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate that fine reason exists and is not soft deleted
    const fineReason = await db.select()
      .from(fineReasons)
      .where(and(eq(fineReasons.id, parseInt(fineReasonId)), isNull(fineReasons.deletedAt)))
      .limit(1);

    if (fineReason.length === 0) {
      return NextResponse.json({ 
        error: "Fine reason not found",
        code: "FINE_REASON_NOT_FOUND" 
      }, { status: 404 });
    }

    // Create new fine
    const newFine = await db.insert(fines)
      .values({
        playerId: parseInt(playerId),
        fineReasonId: parseInt(fineReasonId),
        amount: parseFloat(amount),
        fineDate: fineDate.trim(),
        addedByUserId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Return created fine with JOINed data
    const createdFineWithDetails = await db.select({
      id: fines.id,
      playerId: fines.playerId,
      playerName: players.name,
      fineReasonId: fines.fineReasonId,
      fineReasonName: fineReasons.reason,
      amount: fines.amount,
      fineDate: fines.fineDate,
      addedById: fines.addedByUserId,
      addedByName: users.name,
      createdAt: fines.createdAt,
      updatedAt: fines.updatedAt
    })
    .from(fines)
    .leftJoin(players, eq(fines.playerId, players.id))
    .leftJoin(fineReasons, eq(fines.fineReasonId, fineReasons.id))
    .leftJoin(users, eq(fines.addedByUserId, users.id))
    .where(eq(fines.id, newFine[0].id))
    .limit(1);

    return NextResponse.json(createdFineWithDetails[0], { status: 201 });
  } catch (error) {
    console.error('POST fines error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}