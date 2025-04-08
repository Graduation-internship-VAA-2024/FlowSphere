/**
 * Utility functions for handling WebSocket connections with Appwrite
 */

import { Client } from "appwrite";

/**
 * Waits for the WebSocket to be in the OPEN state before proceeding
 * @param client Appwrite client instance
 * @param maxAttempts Maximum number of attempts to check WebSocket state
 * @param initialDelay Initial delay in ms between attempts (will increase with backoff)
 * @returns Promise that resolves when WebSocket is ready or rejects after max attempts
 */
export const waitForWebSocketReady = async (
  client: Client,
  maxAttempts = 10,
  initialDelay = 300
): Promise<boolean> => {
  // Access the internal WebSocket connection
  const getSocket = () => (client as any).socketConnection?.socket;

  // Check if WebSocket is already in OPEN state
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    return true;
  }

  // Helper function to wait a specific amount of time
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Try to ping to establish connection
  try {
    // This will trigger WebSocket connection initialization
    const pingSubscription = client.subscribe("connection-test", () => {});
    // Immediately unsubscribe to keep things clean
    setTimeout(() => {
      try {
        pingSubscription();
      } catch (error) {
        // Ignore errors when unsubscribing
      }
    }, 100);
  } catch (error) {
    console.log("Error during initial ping:", error);
    // Continue anyway, we'll check the socket state
  }

  // Try connecting with exponential backoff
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Calculate backoff delay
    const delay = Math.min(initialDelay * Math.pow(1.5, attempt - 1), 8000);

    // Wait before checking
    await wait(delay);

    // Get current socket state
    const currentSocket = getSocket();

    // If no socket exists yet, continue waiting
    if (!currentSocket) {
      console.log(
        `No WebSocket connection found (attempt ${attempt}/${maxAttempts})`
      );
      continue;
    }

    // If socket is open, we're good to go
    if (currentSocket.readyState === WebSocket.OPEN) {
      console.log(`WebSocket is ready after ${attempt} attempts`);
      return true;
    }

    // If socket is connecting, wait for next attempt
    if (currentSocket.readyState === WebSocket.CONNECTING) {
      console.log(
        `WebSocket still connecting (attempt ${attempt}/${maxAttempts})`
      );
      continue;
    }

    // If socket is closed or closing, try to force a new connection
    if (
      currentSocket.readyState === WebSocket.CLOSED ||
      currentSocket.readyState === WebSocket.CLOSING
    ) {
      console.log(
        `WebSocket is closed/closing, attempting to reconnect (attempt ${attempt}/${maxAttempts})`
      );
      // Try to force a new connection
      try {
        client.subscribe("reconnect-ping", () => {});
      } catch (error) {
        // Ignore errors, just trying to trigger a new connection
      }
    }
  }

  // If we got here, we failed to connect after max attempts
  console.error(
    `Failed to establish WebSocket connection after ${maxAttempts} attempts`
  );
  return false;
};

/**
 * Safely subscribe to an Appwrite realtime channel with connection verification
 * @param client Appwrite client instance
 * @param channelId Channel ID to subscribe to
 * @param callback Callback function to handle events
 * @returns Unsubscribe function or null if subscription failed
 */
export const safeSubscribe = async (
  client: Client,
  channelId: string,
  callback: (response: any) => void
): Promise<(() => void) | null> => {
  try {
    // First ensure WebSocket is ready
    const isReady = await waitForWebSocketReady(client);

    if (!isReady) {
      console.error(`Cannot subscribe to ${channelId} - WebSocket not ready`);
      return null;
    }

    // Now subscribe safely
    return client.subscribe(channelId, callback);
  } catch (error) {
    console.error(`Error subscribing to ${channelId}:`, error);
    return null;
  }
};
