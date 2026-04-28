import Pusher from "pusher";
import {
    ATTENDANCE_REALTIME_EVENT_NAME,
    AttendanceRealtimeEvent,
    buildAttendanceChannelName
} from "@/lib/realtime/attendance-events";

function isRealtimeEnabled(): boolean {
    return Boolean(
        process.env.PUSHER_APP_ID
        && process.env.PUSHER_KEY
        && process.env.PUSHER_SECRET
        && process.env.PUSHER_CLUSTER
    );
}

let cachedPusherServer: Pusher | null = null;

function getPusherServer(): Pusher | null {
    if (!isRealtimeEnabled()) {
        return null;
    }

    if (cachedPusherServer) {
        return cachedPusherServer;
    }

    cachedPusherServer = new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.PUSHER_CLUSTER!,
        useTLS: true
    });

    return cachedPusherServer;
}

/**
 * Publishes an attendance update event to the appropriate Pusher channel.
 *
 * No-ops silently when Pusher server credentials are not configured, so the
 * application degrades gracefully in environments without realtime support.
 *
 * @param event - The {@link AttendanceRealtimeEvent} to broadcast.
 */
export async function publishAttendanceRealtimeEvent(event: AttendanceRealtimeEvent): Promise<void> {
    const pusherServer = getPusherServer();
    if (!pusherServer) {
        return;
    }

    await pusherServer.trigger(
        buildAttendanceChannelName(event.sessionId),
        ATTENDANCE_REALTIME_EVENT_NAME,
        event
    );
}

/**
 * Generates a Pusher channel authorization token for a private channel.
 *
 * Called from the `/api/realtime/pusher/auth` route handler when a client
 * requests access to a private attendance channel.
 *
 * @param socketId - The socket ID provided by the Pusher client.
 * @param channelName - The private channel name the client wants to join.
 * @returns An `{ auth: string }` object to return to the client.
 * @throws {Error} If Pusher is not configured.
 */
export function authorizePrivateChannel(socketId: string, channelName: string): { auth: string } {
    const pusherServer = getPusherServer();

    if (!pusherServer) {
        throw new Error("Pusher realtime is not configured.");
    }

    return pusherServer.authorizeChannel(socketId, channelName);
}
