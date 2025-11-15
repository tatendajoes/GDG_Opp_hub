"use client"

// TODO: Implement authentication hook (Issue #4)
// This will be implemented when working on authentication UI
export function useAuth() {
  return {
    user: null,
    loading: false,
    signIn: async () => {},
    signOut: async () => {},
    signUp: async () => {},
  }
}

