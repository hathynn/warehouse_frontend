// src/config/pusher.ts
import Pusher from 'pusher-js';

// You may want to load these from env vars in production
const PUSHER_KEY = '0c02fd43e1874d8d71e4'; // <-- Replace with your actual key
const PUSHER_CLUSTER = 'ap1'; // <-- Replace with your actual cluster

export const WAREHOUSE_MANAGER_CHANNEL = 'notifications-WAREHOUSE_MANAGER';
export const IMPORT_ORDER_EVENT = 'import-order-created';

export function createPusherClient() {
  return new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
  });
}
