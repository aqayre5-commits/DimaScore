'use client';

import { useState } from 'react';

export interface OembedResult {
  videoId: string;
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
}

interface PasteUrlFormProps {
  onResult: (data: OembedResult) => void;
}

export function PasteUrlForm({ onResult }: PasteUrlFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFetch() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/media/oembed?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch video info');
        return;
      }

      onResult(data as OembedResult);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="youtube-url" className="block text-sm font-medium text-text-secondary">
        YouTube URL
      </label>
      <div className="flex gap-2">
        <input
          id="youtube-url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleFetch();
            }
          }}
          className="h-9 flex-1 rounded-md border border-border-subtle bg-bg-canvas px-3 text-sm text-text-primary outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
        />
        <button
          type="button"
          onClick={handleFetch}
          disabled={!url.trim() || loading}
          className="h-9 shrink-0 rounded-md bg-accent-gold px-4 text-sm font-medium text-bg-canvas transition-colors hover:bg-accent-gold/90 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
