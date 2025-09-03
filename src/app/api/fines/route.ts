import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fines, players, fineReasons, users } from '@/db/schema';
import { eq, like, and, isNull, desc, asc, or } from 'drizzle-orm';

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
    const playerId = searchParams.get('player_id');
    const reasonId = searchParams.get('reason_id');
    const search = searchParams.get('search');
    const includeDeleted = searchParams.get('include_deleted') === 'true';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build the query with joins
    let query = db.select({
      id: fines.id,
      amount: fines.amount,
      notes: fines.notes,
      createdAt: fines.createdAt,
      updatedAt: fines.updatedAt,
      deletedAt: fines.deletedAt,
      player: {
        id: players.id,
        name: players.name,
      },
      reason: {
        id: fineReasons.id,
        reason: fineReasons.reason,
      }
    })
    .from(fines)
    .leftJoin(players, eq(fines.playerId, players.id))
    .leftJoin(fineReasons, eq(fines.reasonId, fineReasons.id));

    const conditions = [];

    // Only include deleted fines if specifically requested
    if (!includeDeleted) {
      conditions.push(isNull(fines.deletedAt));
    }

    if (playerId) {
      conditions.push(eq(fines.playerId, parseInt(playerId)));
    }

    if (reasonId) {
      conditions.push(eq(fines.reasonId, parseInt(reasonId)));
    }

    if (search) {
      conditions.push(
        or(
          like(players.name, `%${search}%`),
          like(fineReasons.reason, `%${search}%`),
          like(fines.notes, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sortBy === 'amount') {
      query = sortOrder === 'asc' ? query.orderBy(asc(fines.amount)) : query.orderBy(desc(fines.amount));
    } else if (sortBy === 'player') {
      query = sortOrder === 'asc' ? query.orderBy(asc(players.name)) : query.orderBy(desc(players.name));
    } else if (sortBy === 'reason') {
      query = sortOrder === 'asc' ? query.orderBy(asc(fineReasons.reason)) : query.orderBy(desc(fineReasons.reason));
    } else {
      // Default to created_at
      query = sortOrder === 'asc' ? query.orderBy(asc(fines.createdAt)) : query.orderBy(desc(fines.createdAt));
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
    
    // Only admin and superadmin can add fines
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only admin and superadmin can add fines.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const requestBody = await request.json();
    const { playerId, reasonId, amount, notes } = requestBody;

    // Validate required fields
    if (!playerId || !reasonId || amount === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields: playerId, reasonId, amount",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ 
        error: "Amount must be a non-negative number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Validate player exists and is not deleted
    const player = await db.select()
      .from(players)
      .where(and(
        eq(players.id, playerId),
        isNull(players.deletedAt)
      ))
      .limit(1);

    if (player.length === 0) {
      return NextResponse.json({ 
        error: "Player not found or inactive",
        code: "PLAYER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate fine reason exists and is not deleted
    const fineReason = await db.select()
      .from(fineReasons)
      .where(and(
        eq(fineReasons.id, reasonId),
        isNull(fineReasons.deletedAt)
      ))
      .limit(1);

    if (fineReason.length === 0) {
      return NextResponse.json({ 
        error: "Fine reason not found or inactive",
        code: "REASON_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate notes length if provided
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
      return NextResponse.json({ 
        error: "Notes must be a string with maximum 500 characters",
        code: "INVALID_NOTES" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData = {
      playerId,
      reasonId,
      amount,
      notes: notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    const newFine = await db.insert(fines)
      .values(insertData)
      .returning();

    // Return the fine with joined player and reason data
    const createdFine = await db.select({
      id: fines.id,
      amount: fines.amount,
      notes: fines.notes,
      createdAt: fines.createdAt,
      updatedAt: fines.updatedAt,
      deletedAt: fines.deletedAt,
      player: {
        id: players.id,
        name: players.name,
      },
      reason: {
        id: fineReasons.id,
        reason: fineReasons.reason,
      }
    })
    .from(fines)
    .leftJoin(players, eq(fines.playerId, players.id))
    .leftJoin(fineReasons, eq(fines.reasonId, fineReasons.id))
    .where(eq(fines.id, newFine[0].id))
    .limit(1);

    return NextResponse.json(createdFine[0], { status: 201 });
  } catch (error) {
    console.error('POST fines error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}