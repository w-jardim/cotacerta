export const APP_NAME = 'CotaCerta';

export const USER_ROLES = {
  ADMIN_PLATFORM: 'ADMIN_PLATFORM',
  GESTOR_MASTER: 'GESTOR_MASTER',
  COTISTA: 'COTISTA'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
