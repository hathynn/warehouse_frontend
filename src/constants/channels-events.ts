// Channel names must match the ones in NotificationUtil.java
// These are public channel names
export const WAREHOUSE_MANAGER_CHANNEL = 'notifications-WAREHOUSE_MANAGER';
export const DEPARTMENT_CHANNEL = 'notifications-DEPARTMENT';
export const STAFF_CHANNEL = 'notifications-STAFF';
export const ACCOUNTING_CHANNEL = 'notifications-ACCOUNTING';
export const ADMIN_CHANNEL = 'notifications-ADMIN';

// Private channel names - prepend 'private-' to conform with Pusher's private channel naming convention
export const PRIVATE_WAREHOUSE_MANAGER_CHANNEL = `private-${WAREHOUSE_MANAGER_CHANNEL}`;
export const PRIVATE_DEPARTMENT_CHANNEL = `private-${DEPARTMENT_CHANNEL}`;
export const PRIVATE_STAFF_CHANNEL = `private-${STAFF_CHANNEL}`;
export const PRIVATE_ACCOUNTING_CHANNEL = `private-${ACCOUNTING_CHANNEL}`;
export const PRIVATE_ADMIN_CHANNEL = `private-${ADMIN_CHANNEL}`;

// Events
export const IMPORT_ORDER_EVENT = 'import-order-created';