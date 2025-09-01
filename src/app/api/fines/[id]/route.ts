import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fines, players, fineReasons } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Note: Authentication will be added later when auth system is implemented
    // For now, we'll use user ID 1 as default admin user

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { playerId, fineReasonId, amount, fineDate } = requestBody;

    // Security: User ID injection prevention
    if ('addedByUserId' in requestBody || 'added_by_user_id' in requestBody || 'userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if fine exists and is not soft deleted
    const existingFine = await db.select()
      .from(fines)
      .where(and(eq(fines.id, parseInt(id)), isNull(fines.deletedAt)))
      .limit(1);

    if (existingFine.length === 0) {
      return NextResponse.json({ 
        error: 'Fine not found',
        code: 'FINE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate required fields
    if (playerId !== undefined && (!playerId || isNaN(parseInt(playerId)))) {
      return NextResponse.json({ 
        error: "Valid player ID is required",
        code: "INVALID_PLAYER_ID" 
      }, { status: 400 });
    }

    if (fineReasonId !== undefined && (!fineReasonId || isNaN(parseInt(fineReasonId)))) {
      return NextResponse.json({ 
        error: "Valid fine reason ID is required",
        code: "INVALID_FINE_REASON_ID" 
      }, { status: 400 });
    }

    if (amount !== undefined && (amount === null || amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      return NextResponse.json({ 
        error: "Valid amount is required and must be greater than 0",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    if (fineDate !== undefined && (!fineDate || fineDate.trim() === '')) {
      return NextResponse.json({ 
        error: "Fine date is required",
        code: "MISSING_FINE_DATE" 
      }, { status: 400 });
    }

    // Validate foreign keys if provided
    if (playerId !== undefined) {
      const playerExists = await db.select()
        .from(players)
        .where(and(eq(players.id, parseInt(playerId)), isNull(players.deletedAt)))
        .limit(1);

      if (playerExists.length === 0) {
        return NextResponse.json({ 
          error: 'Player not found',
          code: 'PLAYER_NOT_FOUND' 
        }, { status: 400 });
      }
    }

    if (fineReasonId !== undefined) {
      const fineReasonExists = await db.select()
        .from(fineReasons)
        .where(and(eq(fineReasons.id, parseInt(fineReasonId)), isNull(fineReasons.deletedAt)))
        .limit(1);

      if (fineReasonExists.length === 0) {
        return NextResponse.json({ 
          error: 'Fine reason not found',
          code: 'FINE_REASON_NOT_FOUND' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
      addedByUserId: 1 // Default admin user until auth is implemented
    };

    if (playerId !== undefined) updateData.playerId = parseInt(playerId);
    if (fineReasonId !== undefined) updateData.fineReasonId = parseInt(fineReasonId);
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (fineDate !== undefined) updateData.fineDate = fineDate.trim();

    // Update the fine
    const updated = await db.update(fines)
      .set(updateData)
      .where(eq(fines.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update fine',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization token required',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Parse user ID from token (format: user_${userId}_${timestamp})
    const tokenParts = token.split('_');
    if (tokenParts.length !== 3 || tokenParts[0] !== 'user') {
      return NextResponse.json({ 
        error: 'Invalid token format',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userId = parseInt(tokenParts[1]);
    if (isNaN(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID in token',
        code: 'INVALID_USER_ID' 
      }, { status: 401 });
    }

    // Check user role - only super admin can delete fines
    const { users } = await import('@/db/schema');
    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const user = userResult[0];
    if (user.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Only super admin can delete fines',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if fine exists and is not already soft deleted
    const existingFine = await db.select()
      .from(fines)
      .where(and(eq(fines.id, parseInt(id)), isNull(fines.deletedAt)))
      .limit(1);

    if (existingFine.length === 0) {
      return NextResponse.json({ 
        error: 'Fine not found',
        code: 'FINE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Soft delete the fine
    const deleted = await db.update(fines)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(fines.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete fine',
        code: 'DELETE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Fine deleted successfully',
      fine: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}