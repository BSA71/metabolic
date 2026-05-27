import type { Role } from '../types';

const adminRoles: Role[] = ['SUPER_ADMIN', 'ADMIN'];

export function isAdminRole(role?: Role | null) {
  return role ? adminRoles.includes(role) : false;
}
