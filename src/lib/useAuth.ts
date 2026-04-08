'use client';

/**
 * useAuth — thin re-export from AuthContext.
 *
 * All existing imports of `useAuth` and `AuthUser` continue to work
 * without any changes in other files.  The hook now reads from the
 * AuthProvider context rather than creating an independent useState
 * per component, which was causing "infinite loading" after sign-in.
 */

export { useAuth } from './AuthContext';
export type { AuthUser } from './AuthContext';
