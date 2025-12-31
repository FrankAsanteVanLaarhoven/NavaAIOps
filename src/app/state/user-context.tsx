'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Initialize with a default demo user to prevent blank screen
  const [user, setUser] = useState<User | null>({
    id: 'demo-user',
    email: 'demo@example.com',
    name: 'Demo User',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch or create demo user (non-blocking)
    async function initUser() {
      try {
        // Try to get existing user or create demo user
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Create demo user
          const createResponse = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'demo@example.com',
              name: 'Demo User',
            }),
          });
          if (createResponse.ok) {
            const userData = await createResponse.json();
            setUser(userData);
          }
        }
      } catch (error) {
        // Silently fail - keep default demo user
        console.warn('Failed to initialize user:', error);
      }
    }

    // Run in background, don't block render
    initUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
