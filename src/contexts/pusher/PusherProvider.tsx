import { ReactNode, useEffect, useRef, useState } from "react";
import { NotificationEvent, PusherContext, PusherContextType } from "./PusherContext";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { createPusherClient } from "@/config/pusher";
import { getChannelForRole } from "@/utils/helpers";
import { staticAppEvents, dynamicAppEvents } from "@/constants/channelsNEvents";

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
    setLatestNotification({ type: eventType, data, timestamp: Date.now() });
  };

  // Handler for dynamic notification events (with IDs)
  const handleDynamicNotificationEvent = (data: any, eventName: string) => {
    setLatestNotification({ type: eventName, data, timestamp: Date.now() });
  };

  useEffect(() => {
    // Only set up Pusher if user is authenticated and has a role
    if (!isAuthenticated || !role || !accountId) {
      // Clean up existing connection if user is not authenticated
      if (pusherRef.current) {
        if (channelRef.current) {
          channelRef.current.unbind_all();
          pusherRef.current.unsubscribe(channelRef.current.name);
          channelRef.current = null;
        }
        pusherRef.current.disconnect();
        pusherRef.current = null;
        setIsConnected(false);
      }
      return undefined;
    }

    // Determine Pusher channel for this role
    const channelName = getChannelForRole(role);
    if (!channelName) {
      setConnectionError(`No channel defined for role: ${role}`);
      return undefined;
    }

    try {
      // Create Pusher instance if it doesn't exist
      if (!pusherRef.current) {
        pusherRef.current = createPusherClient();

        pusherRef.current.connection.bind('connected', () => {
          setIsConnected(true);
          setConnectionError(null);
        });

        pusherRef.current.connection.bind('disconnected', () => {
          setIsConnected(false);
        });

        pusherRef.current.connection.bind('error', (error: any) => {
          setConnectionError(`Connection error: ${error.message || 'Unknown error'}`);
          setIsConnected(false);
        });
      }

      // Subscribe to the channel and bind events
      const channel = pusherRef.current.subscribe(channelName);
      channelRef.current = channel;
      channel.bind('pusher:subscription_succeeded', () => {
        setConnectionError(null);
      });
      channel.bind('pusher:subscription_error', (error: any) => {
        setConnectionError(`Subscription error: ${error.message || 'Unknown error'}`);
      });
      // Use bind_global to handle all application events
      channel.bind_global((eventName: string, data: any) => {
        // Skip pusher system events
        if (eventName.startsWith('pusher:')) return;
        
        // Handle static events
        if (staticAppEvents.includes(eventName)) {
          handleNotificationEvent(data, eventName);
          return;
        }
        
        // Handle dynamic events with IDs
        const isDynamicEvent = dynamicAppEvents.some(event => 
          eventName.startsWith(event + '-')
        );
        
        if (isDynamicEvent) {
          handleDynamicNotificationEvent(data, eventName);
        }
      }); 
    } catch (error) {
      setConnectionError(`Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
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