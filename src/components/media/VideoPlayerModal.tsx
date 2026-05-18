'use client';

import { Dialog } from '@base-ui/react/dialog';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { XIcon } from 'lucide-react';

interface VideoPlayerModalProps {
  youtubeId: string | null;
  title: string;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ youtubeId, title, open, onClose }: VideoPlayerModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0">
          <div className="relative w-full max-w-[900px]">
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-10 right-0 flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
              aria-label="Close"
            >
              <XIcon className="size-5" />
            </button>
            <div className="overflow-hidden rounded-lg">
              {youtubeId && (
                <LiteYouTubeEmbed id={youtubeId} title={title} poster="hqdefault" cookie={false} />
              )}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
