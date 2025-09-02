import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// Define valid settings and their validation rules
const VALID_SETTINGS = {
  currency: {
    validate: (value: string) => ['$', '€', '£', '₹'].includes(value),
    error: 'Currency must be a valid symbol ($, €, £, ₹)'
  },
  fineFrequency: {
    validate: (value: string) => ['week', 'month', 'season', 'match'].includes(value),
    error: 'Fine frequency must be one of: week, month, season, match'
  },
  appName: {
    validate: (value: string) => value.trim().length > 0 && value.trim().length <= 100,
    error: 'App name must be between 1 and 100 characters'
  },
  logoUrl: {
    validate: (value: string) => !value || /^https?:\/\/.+/.test(value),
    error: 'Logo URL must be a valid HTTP/HTTPS URL'
  }
};

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.email) {
      return null;
    }

    // Get user from our database using email
    const users = await db.select().from(db.schema.users).where(eq(db.schema.users.email, session.user.email));
    return users[0] || null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const allSettings = await db.select({
      settingKey: settings.settingKey,
      settingValue: settings.settingValue,
      updatedAt: settings.updatedAt
    }).from(settings);

    // Transform to key-value pairs with defaults
    const settingsObject: Record<string, string> = {
      currency: '₹', // Default to Indian Rupee
      fineFrequency: 'match',
      appName: 'CCL Fines',
      logoUrl: ''
    };
    
    allSettings.forEach(setting => {
      settingsObject[setting.settingKey] = setting.settingValue;
    });

    return NextResponse.json(settingsObject);

  } catch (error) {
    console.error('GET settings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const requestBody = await request.json();

    // Validate request body is an object with key-value pairs
    if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
      return NextResponse.json({ 
        error: "Request body must be an object with key-value pairs",
        code: "INVALID_BODY_FORMAT" 
      }, { status: 400 });
    }

    const updateKeys = Object.keys(requestBody);
    if (updateKeys.length === 0) {
      return NextResponse.json({ 
        error: "No settings provided to update",
        code: "NO_SETTINGS_PROVIDED" 
      }, { status: 400 });
    }

    // Always ensure currency is Indian Rupee
    requestBody.currency = '₹';

    // Validate each setting key and value
    for (const [key, value] of Object.entries(requestBody)) {
      if (typeof value !== 'string') {
        return NextResponse.json({ 
          error: `Setting value for '${key}' must be a string`,
          code: "INVALID_VALUE_TYPE" 
        }, { status: 400 });
      }

      if (VALID_SETTINGS[key as keyof typeof VALID_SETTINGS]) {
        const validator = VALID_SETTINGS[key as keyof typeof VALID_SETTINGS];
        if (!validator.validate(value)) {
          return NextResponse.json({ 
            error: validator.error,
            code: "INVALID_SETTING_VALUE",
            setting: key 
          }, { status: 400 });
        }
      }
    }

    const now = new Date().toISOString();
    const updatedSettings: Record<string, string> = {};

    // Upsert each setting
    for (const [key, value] of Object.entries(requestBody)) {
      try {
        // Try to insert first
        const inserted = await db.insert(settings)
          .values({
            settingKey: key,
            settingValue: value as string,
            updatedByUserId: user.id,
            createdAt: now,
            updatedAt: now
          })
          .returning();
        
        updatedSettings[key] = value as string;
      } catch (insertError) {
        // If insert fails (likely due to unique constraint), try update
        try {
          const updated = await db.update(settings)
            .set({
              settingValue: value as string,
              updatedByUserId: user.id,
              updatedAt: now
            })
            .where(eq(settings.settingKey, key))
            .returning();

          if (updated.length === 0) {
            return NextResponse.json({ 
              error: `Failed to update setting: ${key}`,
              code: "UPDATE_FAILED" 
            }, { status: 500 });
          }

          updatedSettings[key] = value as string;
        } catch (updateError) {
          console.error(`Error upserting setting ${key}:`, updateError);
          return NextResponse.json({ 
            error: `Failed to save setting: ${key}`,
            code: "UPSERT_FAILED" 
          }, { status: 500 });
        }
      }
    }

    // Return updated settings
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('POST settings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// Also support PUT for backward compatibility
export async function PUT(request: NextRequest) {
  return POST(request);
}