'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PasteUrlForm, type OembedResult } from '@/components/admin/PasteUrlForm';
import { VideoTagger } from '@/components/admin/VideoTagger';

const CATEGORIES = [
  'highlights',
  'goals',
  'interview',
  'analysis',
  'preview',
  'documentary',
  'news',
  'training',
] as const;

interface TagItem {
  id: number;
  label: string;
}

interface AddVideoFormProps {
  competitions: TagItem[];
  initialTeams: TagItem[];
}

export function AddVideoForm({ competitions, initialTeams }: AddVideoFormProps) {
  const router = useRouter();
  const [oembed, setOembed] = useState<OembedResult | null>(null);
  const [category, setCategory] = useState<string>('highlights');
  const [language, setLanguage] = useState('fr');
  const [isFeatured, setIsFeatured] = useState(false);
  const [competitionIds, setCompetitionIds] = useState<number[]>([]);
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [fixtureIds, setFixtureIds] = useState<number[]>([]);
  const [playerIds, setPlayerIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!oembed) return;
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/v1/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeId: oembed.videoId,
          title: oembed.title,
          channelName: oembed.author_name,
          channelUrl: oembed.author_url,
          thumbnailUrl: oembed.thumbnail_url,
          category,
          language,
          isFeatured,
          competitionIds,
          teamIds,
          fixtureIds,
          playerIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Save failed');
        return;
      }

      router.push('/admin/media');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Add Video</h1>
        <Link href="/admin/media" className="text-sm text-text-tertiary hover:text-text-secondary">
          Back to list
        </Link>
      </div>

      {/* Step 1: Paste URL */}
      <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
        <PasteUrlForm onResult={setOembed} />

        {oembed && (
          <div className="mt-4 flex gap-3 rounded-md bg-bg-raised p-3">
            <img
              src={oembed.thumbnail_url}
              alt=""
              className="h-16 w-28 shrink-0 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{oembed.title}</p>
              <p className="text-xs text-text-tertiary">{oembed.author_name}</p>
              <p className="text-xs text-text-tertiary">ID: {oembed.videoId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Category + Tags (shown after oEmbed success) */}
      {oembed && (
        <>
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-subtle bg-bg-canvas px-2 text-sm text-text-primary outline-none focus:border-accent-gold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="language" className="block text-sm font-medium text-text-secondary">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-subtle bg-bg-canvas px-2 text-sm text-text-primary outline-none focus:border-accent-gold"
                >
                  <option value="fr">French</option>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-border-subtle"
              />
              Featured on homepage
            </label>
          </div>

          <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-text-secondary">Tags</h2>
            <VideoTagger
              competitions={competitions}
              initialTeams={initialTeams}
              selectedCompetitionIds={competitionIds}
              onCompetitionIdsChange={setCompetitionIds}
              selectedTeamIds={teamIds}
              onTeamIdsChange={setTeamIds}
              selectedFixtureIds={fixtureIds}
              onFixtureIdsChange={setFixtureIds}
              selectedPlayerIds={playerIds}
              onPlayerIdsChange={setPlayerIds}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 w-full rounded-md bg-accent-gold px-4 text-sm font-medium text-bg-canvas transition-colors hover:bg-accent-gold/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save video'}
          </button>
        </>
      )}
    </div>
  );
}
