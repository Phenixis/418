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

export function authorizePrivateChannel(socketId: string, channelName: string): { auth: string } {
    const pusherServer = getPusherServer();

    if (!pusherServer) {
        throw new Error("Pusher realtime is not configured.");
    }

    return pusherServer.authorizeChannel(socketId, channelName);
}
