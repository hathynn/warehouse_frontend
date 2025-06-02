import { ReactNode, useEffect, useRef, useState } from "react";
import { NotificationEvent, PusherContext, PusherContextType } from "./PusherContext";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { createPusherClient } from "@/config/pusher";
import { getChannelForRole } from "@/utils/helpers";
import { IMPORT_ORDER_CREATED_EVENT, IMPORT_ORDER_COUNTED_EVENT, IMPORT_ORDER_CONFIRMED_EVENT } from "@/constants/channelsNEvents";

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
      return undefined;
    }

    // Determine Pusher channel for this role
    const channelName = getChannelForRole(role);
    if (!channelName) {
      setConnectionError(`No channel defined for role: ${role}`);
      return undefined;
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