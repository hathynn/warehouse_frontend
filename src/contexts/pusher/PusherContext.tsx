import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/contexts/redux/store';
import { createPusherClient } from '@/config/pusher';
import { AccountRole } from '@/utils/enums';
import {
  IMPORT_ORDER_CREATED_EVENT,
  IMPORT_ORDER_COUNTED_EVENT,
  IMPORT_ORDER_CONFIRMED_EVENT,
  PRIVATE_WAREHOUSE_MANAGER_CHANNEL,
  PRIVATE_DEPARTMENT_CHANNEL,
  PRIVATE_STAFF_CHANNEL,
  PRIVATE_ACCOUNTING_CHANNEL,
  PRIVATE_ADMIN_CHANNEL
} from '@/constants/channels-events';
import { NotificationResponse } from "@/hooks/useNotificationService";

export interface NotificationEvent {
  type: string;
  data: NotificationResponse;
  timestamp: number;
}

interface PusherContextType {
  latestNotification: NotificationEvent | null;
  isConnected: boolean;
  connectionError: string | null;
}

const PusherContext = createContext<PusherContextType | undefined>(undefined);

// Helper to map user roles to Pusher channels without hooks
function getChannelForRole(userRole: AccountRole): string | null {
  switch (userRole) {
    case AccountRole.WAREHOUSE_MANAGER:
      return PRIVATE_WAREHOUSE_MANAGER_CHANNEL;
    case AccountRole.DEPARTMENT:
      return PRIVATE_DEPARTMENT_CHANNEL;
    case AccountRole.STAFF:
      return PRIVATE_STAFF_CHANNEL;
    case AccountRole.ACCOUNTING:
      return PRIVATE_ACCOUNTING_CHANNEL;
    case AccountRole.ADMIN:
      return PRIVATE_ADMIN_CHANNEL;
    default:
      console.warn(`No channel defined for role: ${userRole}`);
      return null;
  }
}

export const PusherProvider = ({ children }: { children: ReactNode }) => {
  const [latestNotification, setLatestNotification] = useState<NotificationEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { role, id: accountId, isAuthenticated } = useSelector((state: RootState) => state.user);
  
  // Create Pusher instance only once
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Handler for notification events
  const handleNotificationEvent = (data: any, eventType: string) => {
    console.log(`[Pusher] ${eventType} notification:`, data);
    setLatestNotification({ type: eventType, data, timestamp: Date.now() });
  };

  useEffect(() => {
    // Only set up Pusher if user is authenticated and has a role
    if (!isAuthenticated || !role || !accountId) {
      // Clean up existing connection if user is not authenticated
      if (pusherRef.current) {
        console.log('Cleaning up Pusher connection - user not authenticated');
        if (channelRef.current) {
          channelRef.current.unbind_all();
          pusherRef.current.unsubscribe(channelRef.current.name);
          channelRef.current = null;
        }
        pusherRef.current.disconnect();
        pusherRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Determine Pusher channel for this role
    const channelName = getChannelForRole(role);
    if (!channelName) {
      setConnectionError(`No channel defined for role: ${role}`);
      return;
    }

    console.log(`Setting up Pusher for role: ${role}, channel: ${channelName}`);

    try {
      // Create Pusher instance if it doesn't exist
      if (!pusherRef.current) {
        pusherRef.current = createPusherClient();

        pusherRef.current.connection.bind('connected', () => {
          console.log('Pusher connected');
          setIsConnected(true);
          setConnectionError(null);
        });

        pusherRef.current.connection.bind('disconnected', () => {
          console.log('Pusher disconnected');
          setIsConnected(false);
        });

        pusherRef.current.connection.bind('error', (error: any) => {
          console.error('Pusher connection error:', error);
          setConnectionError(`Connection error: ${error.message || 'Unknown error'}`);
          setIsConnected(false);
        });
      }

      // Subscribe to the channel and bind events
      const channel = pusherRef.current.subscribe(channelName);
      channelRef.current = channel;
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to ${channelName}`);
        setConnectionError(null);
      });
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error(`Error subscribing to ${channelName}:`, error);
        setConnectionError(`Subscription error: ${error.message || 'Unknown error'}`);
      });
      channel.bind(IMPORT_ORDER_CREATED_EVENT, (data: any) => handleNotificationEvent(data, IMPORT_ORDER_CREATED_EVENT));
      channel.bind(IMPORT_ORDER_COUNTED_EVENT, (data: any) => handleNotificationEvent(data, IMPORT_ORDER_COUNTED_EVENT));
      channel.bind(IMPORT_ORDER_CONFIRMED_EVENT, (data: any) => handleNotificationEvent(data, IMPORT_ORDER_CONFIRMED_EVENT));

    } catch (error) {
      console.error('Error setting up Pusher:', error);
      setConnectionError(`Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`Unsubscribing from ${channelName}`);
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [role, accountId, isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pusherRef.current) {
        console.log('Disconnecting Pusher on unmount');
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  const contextValue: PusherContextType = {
    latestNotification,
    isConnected,
    connectionError,
  };

  return (
    <PusherContext.Provider value={contextValue}>
      {children}
    </PusherContext.Provider>
  );
};

export const usePusherContext = () => {
  const context = useContext(PusherContext);
  if (context === undefined) {
    throw new Error("usePusherContext must be used within a PusherProvider");
  }
  return context;
};
