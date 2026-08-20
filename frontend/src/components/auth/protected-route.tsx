import { ReactNode } from 'react'
import { useAuth } from '@/stores/authStore'

type UserRole = 'farmer' | 'mandi_owner' | string
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  requireAuth?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requireAuth = true 
}: ProtectedRouteProps) {
  const auth = useAuth()

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !auth.isAuthenticated()) {
    toast.error('Please sign in to access this page')
    return <Navigate to={`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`} replace />
  }

  // Check if specific roles are required
  if (requiredRoles.length > 0 && !auth.hasAnyRole(requiredRoles)) {
    toast.error('You do not have permission to access this page')
    return <Navigate to="/401" replace />
  }

  return <>{children}</>
}

// Higher-order component for role-based rendering
interface RoleBasedProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleBased({ children, allowedRoles, fallback = null }: RoleBasedProps) {
  const auth = useAuth()
  
  if (!auth.hasAnyRole(allowedRoles)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Hook for conditional rendering based on roles
export function useRoleAccess() {
  const auth = useAuth()
  
  const canAccess = (roles: UserRole[]) => auth.hasAnyRole(roles)
  const hasRole = (role: UserRole) => auth.hasRole(role)
  
  return {
    canAccess,
    hasRole,
    isFarmer: hasRole('farmer'),
    isMandiOwner: hasRole('mandi_owner'),
    // Composite permissions
    canViewCropJourney: canAccess(['farmer', 'mandi_owner']),
    canManageMandi: hasRole('mandi_owner'),
    canListCrops: hasRole('farmer'),
  }
}
