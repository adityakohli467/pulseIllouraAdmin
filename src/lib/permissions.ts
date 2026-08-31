/**
 * Permission system for the Illoura Staff admin portal.
 * Maps menu items and routes to allowed auth_levels.
 *
 * auth_level values (lower = more privileged):
 *   1 = Super Admin, 2 = Admin, 3 = Manager, 5 = Illoura Admin (Illoura-only)
 */

export enum AuthLevel {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  MANAGER = 3,
  ILLOURA_ADMIN = 5,
}

// Auth levels allowed to use this portal: full admins plus the Illoura-only role.
const ILLOURA_ALLOWED = [AuthLevel.SUPER_ADMIN, AuthLevel.ADMIN, AuthLevel.ILLOURA_ADMIN]

export interface MenuPermission {
  // Minimum auth_level required to see this menu item
  minAuthLevel?: number
  // Specific auth_levels that can access (if specified, minAuthLevel is ignored)
  allowedAuthLevels?: number[]
  // Permission key from database (if using granular permissions)
  permissionKey?: string
}

/**
 * Menu item permissions mapping. This portal only exposes Illoura Staff routes.
 */
export const MENU_PERMISSIONS: Record<string, MenuPermission> = {
  '/': { allowedAuthLevels: ILLOURA_ALLOWED },

  '/admin/ellora/orders': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/orders/production-summary': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/products': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/categories': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/options': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/dietary-codes': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/coupons': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/customers': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/ellora/reports': { allowedAuthLevels: ILLOURA_ALLOWED },

  // Cafe Orders module
  '/admin/cafe/dashboard': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/orders': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/orders/production-summary': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/orders/labels': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/products': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/categories': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/options': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/dietary-codes': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/coupons': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/customers': { allowedAuthLevels: ILLOURA_ALLOWED },
  '/admin/cafe/reports': { allowedAuthLevels: ILLOURA_ALLOWED },
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(userAuthLevel: number | undefined, route: string): boolean {
  if (!userAuthLevel) {
    return false
  }

  const permission = MENU_PERMISSIONS[route]

  // If no permission defined, deny access on this portal (Illoura-only surface).
  if (!permission) {
    return false
  }

  // Check specific allowed levels
  if (permission.allowedAuthLevels) {
    return permission.allowedAuthLevels.includes(userAuthLevel)
  }

  // Check minimum auth level
  if (permission.minAuthLevel !== undefined) {
    return userAuthLevel <= permission.minAuthLevel
  }

  return true
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  navigation: Array<{ name: string; href: string; hasDropdown?: boolean; items?: Array<{ name: string; href: string }> }>,
  userAuthLevel: number | undefined
): typeof navigation {
  if (!userAuthLevel) {
    return []
  }

  return navigation
    .map((item) => {
      const canAccessParent = canAccessRoute(userAuthLevel, item.href)

      if (item.hasDropdown && item.items) {
        const filteredItems = item.items.filter((subItem) =>
          canAccessRoute(userAuthLevel, subItem.href)
        )

        if (filteredItems.length === 0) {
          return null
        }

        return {
          ...item,
          items: filteredItems,
        }
      }

      if (!canAccessParent) {
        return null
      }

      return item
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

/**
 * Get role name from auth_level
 */
export function getRoleName(authLevel: number): string {
  switch (authLevel) {
    case AuthLevel.SUPER_ADMIN:
      return 'Super Admin'
    case AuthLevel.ADMIN:
      return 'Admin'
    case AuthLevel.MANAGER:
      return 'Manager'
    case AuthLevel.ILLOURA_ADMIN:
      return 'Illoura Admin'
    default:
      return 'User'
  }
}
