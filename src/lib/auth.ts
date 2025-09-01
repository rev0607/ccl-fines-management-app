import { NextRequest } from 'next/server';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'officer' | 'user';
}

export function getCurrentUser(request: NextRequest): User {
  // Mock user object that matches what the API routes expect
  // This returns a hardcoded user with ID 1 as expected by the current API routes
  return {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin'
  };
}