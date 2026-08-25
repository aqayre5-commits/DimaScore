import Pusher from 'pusher';

let instance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!instance) {
    // Self-hosted Soketi (Railway) speaking the Pusher protocol — host replaces cluster.
    instance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      host: process.env.PUSHER_HOST!,
      port: '443',
      useTLS: true,
    });
  }
  return instance;
}
