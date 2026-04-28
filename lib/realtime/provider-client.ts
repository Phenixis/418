"use client";

import Pusher, { Channel } from "pusher-js";
import {
    ATTENDANCE_REALTIME_EVENT_NAME,
    AttendanceRealtimeEvent,
    buildAttendanceChannelName,
    isAttendanceRealtimeEvent
} from "@/lib/realtime/attendance-events";

/**
 * Current state of the Pusher WebSocket connection for a session subscription.
 *
 * - `"disabled"` — Pusher credentials are not configured; realtime is off.
 * - `"connecting"` — Subscription request sent, waiting for confirmation.
 * - `"connected"` — Successfully subscribed to the private channel.
 * - `"unavailable"` — Subscription failed (auth error or network issue).
 */
export type RealtimeConnectionState = "disabled" | "connecting" | "connected" | "unavailable";

export interface SubscribeOptions {
    sessionId: string;
    onAttendanceEvent: (event: AttendanceRealtimeEvent) => void;
    onConnectionStateChange?: (state: RealtimeConnectionState) => void;
}

let cachedPusherClient: Pusher | null = null;

function hasClientConfig(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
}

function getPusherClient(): Pusher | null {
    if (!hasClientConfig()) {
        if (process.env.NODE_ENV !== "production") {
            console.warn("Realtime disabled: NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER is missing.");
        }
        return null;
    }

    if (cachedPusherClient) {
        return cachedPusherClient;
    }

    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
        throw new Error("Pusher client configuration is incomplete.");
    }

    cachedPusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        channelAuthorization: {
            endpoint: "/api/realtime/pusher/auth",
            transport: "ajax"
        }
    });

    return cachedPusherClient;
}

/**
 * Subscribes to live attendance updates for a session via Pusher.
 *
 * Uses a singleton Pusher client instance (lazily created). Returns a cleanup
 * function that unsubscribes from the channel and removes all event listeners;
 * suitable for use as a `useEffect` return value.
 *
 * When Pusher credentials are not configured, immediately signals `"disabled"`
 * and returns a no-op cleanup function.
 *
 * @param options.sessionId - UUID of the session to subscribe to.
 * @param options.onAttendanceEvent - Called for each validated {@link AttendanceRealtimeEvent}.
 * @param options.onConnectionStateChange - Optional callback tracking the
 *   {@link RealtimeConnectionState}.
 * @returns A cleanup function to call when the subscription is no longer needed.
 */
export function subscribeToAttendanceUpdates(options: SubscribeOptions): () => void {
    const pusherClient = getPusherClient();
    if (!pusherClient) {
        options.onConnectionStateChange?.("disabled");
        return () => {
            return;
        };
    }

    options.onConnectionStateChange?.("connecting");

    const channelName = buildAttendanceChannelName(options.sessionId);
    const channel: Channel = pusherClient.subscribe(channelName);

    const handleAttendanceEvent = (payload: unknown) => {
        if (!isAttendanceRealtimeEvent(payload)) {
            return;
        }

        options.onAttendanceEvent(payload);
    };

    const handleSubscriptionSucceeded = () => {
        options.onConnectionStateChange?.("connected");
    };

    const handleSubscriptionError = () => {
        options.onConnectionStateChange?.("unavailable");
    };

    channel.bind(ATTENDANCE_REALTIME_EVENT_NAME, handleAttendanceEvent);
    channel.bind("pusher:subscription_succeeded", handleSubscriptionSucceeded);
    channel.bind("pusher:subscription_error", handleSubscriptionError);

    return () => {
        channel.unbind(ATTENDANCE_REALTIME_EVENT_NAME, handleAttendanceEvent);
        channel.unbind("pusher:subscription_succeeded", handleSubscriptionSucceeded);
        channel.unbind("pusher:subscription_error", handleSubscriptionError);
        pusherClient.unsubscribe(channelName);
    };
}
