"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
   baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : ""}`,
      },
      onSuccess: (ctx) => {
          const authToken = ctx.response.headers.get("set-auth-token")
          // Store the token securely (e.g., in localStorage)
          if(authToken){
            localStorage.setItem("bearer_token", authToken);
          }
      }
  }
});

// Custom auth client that works with our legacy API endpoints
export const customAuthClient = {
  signIn: {
    email: async ({ email, password, rememberMe }: { email: string; password: string; rememberMe?: boolean }) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: { code: data.code || 'LOGIN_FAILED' }, data: null };
        }

        // Generate a simple bearer token
        const bearerToken = `user_${data.user.id}_${Date.now()}`;
        localStorage.setItem('bearer_token', bearerToken);

        return { data: { user: data.user }, error: null };
      } catch (error) {
        return { error: { code: 'NETWORK_ERROR' }, data: null };
      }
    }
  },
  signUp: {
    email: async ({ email, name, password }: { email: string; name: string; password: string }) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: { code: data.code || 'SIGNUP_FAILED' }, data: null };
        }

        return { data: { user: data.user }, error: null };
      } catch (error) {
        return { error: { code: 'NETWORK_ERROR' }, data: null };
      }
    }
  },
  signOut: async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
      });

      localStorage.removeItem('bearer_token');
      return { error: null };
    } catch (error) {
      localStorage.removeItem('bearer_token');
      return { error: { code: 'NETWORK_ERROR' } };
    }
  },
  getSession: async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      if (!token) {
        return { data: null, error: null };
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('bearer_token');
        return { data: null, error: null };
      }

      const data = await response.json();
      return { data: { user: data.user }, error: null };
    } catch (error) {
      return { data: null, error: null };
    }
  }
};

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): SessionData {
   const [session, setSession] = useState<any>(null);
   const [isPending, setIsPending] = useState(true);
   const [error, setError] = useState<any>(null);

   const refetch = () => {
      setIsPending(true);
      setError(null);
      fetchSession();
   };

   const fetchSession = async () => {
      try {
         const res = await customAuthClient.getSession();
         setSession(res.data);
         setError(res.error);
      } catch (err) {
         setSession(null);
         setError(err);
      } finally {
         setIsPending(false);
      }
   };

   useEffect(() => {
      fetchSession();
   }, []);

   return { data: session, isPending, error, refetch };
}