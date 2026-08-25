import PusherClient from 'pusher-js';

let instance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!instance) {
    // Self-hosted Soketi (Railway) speaking the Pusher protocol. `cluster` is required
    // by pusher-js but ignored once wsHost is set.
    instance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST!,
      wsPort: 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      cluster: 'soketi',
    });
  }
  return instance;
}
