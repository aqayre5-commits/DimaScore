'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchLineup } from '@/lib/db/queries/match-detail';
import {
  pitchSide,
  pitchSlots,
  playerHistory,
  slotPosition,
  type BadgeKind,
  type HistoryEntry,
  type Incident,
  type Phase,
  type PitchSide,
  type Side,
} from '@/lib/match/match-centre';
import { EventIcon, type EventArt } from './icons';
import type { McMatch, McTeam } from './types';
import { isGoalkeeperPos, kitCssVars, type KitPalette } from '@/lib/match/kit-colours';
import { playerDisplayName } from '@/lib/match/player-identity';
import type { LineupState } from '@/lib/match/lineup-state';
import { TeamMark } from '@/components/shared/TeamMark';

type Status = 'sent' | 'off' | 'starter' | 'ready' | 'live' | 'finished';

const art = (k: BadgeKind): EventArt => (k === 'own' ? 'goal' : k);

const kitStyle = (palette: KitPalette | null | undefined) =>
  (palette ? kitCssVars(palette) : {}) as CSSProperties;

const isKeeper = (pos: string | null | undefined, line?: number) =>
  isGoalkeeperPos(pos) || (pos == null && line === 0);

/** Pitch markings and the shirt, defined once per page (template symbols, 68×105 and 52×44). */
function Symbols() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <symbol id="mc-field" viewBox="0 0 68 105">
          <g fill="none" stroke="#f6fff8" strokeWidth=".26" opacity=".95">
            <path d="M.15 .15h67.7v104.7H.15zM0 52.5h68" />
            <circle cx="34" cy="52.5" r="9.15" />
            <circle cx="34" cy="52.5" r=".28" fill="#fff" />
            <g id="mc-endlines">
              <path d="M13.84 .15v16.35h40.32V.15M24.84 .15V5.5h18.32V.15M26.69 16.5a9.15 9.15 0 0 0 14.62 0M1 .15a1 1 0 0 1-.85.85M67 .15a1 1 0 0 0 .85.85" />
              <circle cx="34" cy="11" r=".25" fill="white" />
            </g>
            <use href="#mc-endlines" transform="rotate(180 34 52.5)" />
          </g>
        </symbol>
        <symbol id="mc-jersey" viewBox="0 0 52 44">
          <path
            d="M18.8 2.4C21.6 3.9 30.4 3.9 33.2 2.4L39.8 4.6Q41.6 5.2 43 6.9L50.5 16.4L44.4 22.1L38.5 17.3L39 38.5Q39.2 40.8 37 41.1Q26 43 15 41.1Q12.8 40.8 13 38.5L13.5 17.3L7.6 22.1L1.5 16.4L9 6.9Q10.4 5.2 12.2 4.6Z"
            fill="var(--kit,#8ecff2)"
            stroke="var(--shirt-edge,#293d46)"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <g fill="var(--shirt-sleeve,#75b7dc)">
            <path d="M12.5 5.1L17.9 3.5L15.5 8.8Q13.8 12.2 13.7 16.4L7.6 21.2L2.4 16.4L9.6 7.3Q10.7 5.8 12.5 5.1Z" />
            <path d="M39.5 5.1L34.1 3.5L36.5 8.8Q38.2 12.2 38.3 16.4L44.4 21.2L49.6 16.4L42.4 7.3Q41.3 5.8 39.5 5.1Z" />
          </g>
          <g fill="var(--shirt-trim,#f3faff)">
            <path d="M2.4 16.4L3.9 14.4L9.2 19.8L7.6 21.2Z" />
            <path d="M49.6 16.4L48.1 14.4L42.8 19.8L44.4 21.2Z" />
            <path d="M18.7 2.6Q26 5.2 33.3 2.6L32 6Q26 9.4 20 6Z" />
          </g>
          <path
            d="M21 3.7Q26 5 31 3.7L30.4 5.3Q26 7.5 21.6 5.3Z"
            fill="var(--shirt-edge,#293d46)"
          />
          <path
            d="M15 38.9Q26 40.4 37 38.9"
            fill="none"
            stroke="var(--shirt-edge,#293d46)"
            strokeWidth=".9"
            opacity=".36"
          />
        </symbol>
      </defs>
    </svg>
  );
}

export function Lineups({
  m,
  phase,
  lineups,
  incidents,
  state,
}: {
  m: McMatch;
  phase: Phase;
  lineups: [MatchLineup, MatchLineup];
  incidents: Incident[];
  state: LineupState;
}) {
  const t = useTranslations('matchCentre.lineups');
  const [view, setView] = useState<'start' | 'live'>('start');
  const [shown, setShown] = useState<Side>(0);
  const [selected, setSelected] = useState<[Side, number] | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sides = useMemo(() => {
    const built = lineups.map(pitchSide) as [PitchSide, PitchSide];
    // list: keep the XI and bench, but never infer a pitch from the formation string alone.
    if (state === 'list')
      return built.map((side) => ({ ...side, rows: null })) as [PitchSide, PitchSide];
    return built;
  }, [lineups, state]);
  const teams: [McTeam, McTeam] = [m.home, m.away];
  const started = phase !== 'upcoming';
  const n = (v: number) => v.toLocaleString(m.bcp);
  const minute = (e: { minute: number; extra: number | null }) => (
    <bdi dir="ltr">{`${n(e.minute)}${e.extra ? `+${n(e.extra)}` : ''}′`}</bdi>
  );
  const minuteStr = (e: { minute: number; extra: number | null }) =>
    `${n(e.minute)}${e.extra ? `+${n(e.extra)}` : ''}′`;

  const subNames = new Map<number, string>();
  for (const i of incidents)
    if (i.kind === 'sub') {
      if (i.inId != null && i.inName) subNames.set(i.inId, i.inName);
      if (i.outId != null && i.outName) subNames.set(i.outId, i.outName);
    }
  const player = (s: Side, id: number) => {
    const found = sides[s].players[id] ?? {
      id,
      name: subNames.get(id) ?? '',
      short: subNames.get(id) ?? '',
      num: null,
      pos: null,
      role: null,
    };
    const name = playerDisplayName(found.name, found.num, t('unknownPlayer'));
    return {
      ...found,
      name,
      short: found.name.trim() ? found.short || name : name,
    };
  };
  const history = (id: number) => playerHistory(incidents, id);
  const status = (s: Side, id: number, h: HistoryEntry[]): Status => {
    if (h.some((e) => e.kind === 'red')) return 'sent';
    if (h.some((e) => e.kind === 'off')) return 'off';
    const starter = sides[s].xi.includes(id);
    if (!started) return starter ? 'starter' : 'ready';
    return starter || h.some((e) => e.kind === 'on')
      ? phase === 'finished'
        ? 'finished'
        : 'live'
      : 'ready';
  };
  const statusText = (st: Status) => (st === 'live' ? t('onPitch') : t(st));
  const describe = (s: Side, e: HistoryEntry) =>
    t(e.kind) +
    (e.partner != null
      ? ` · ${t(e.kind === 'on' ? 'replaced' : 'by')} ${player(s, e.partner).name}`
      : '');
  const title = (s: Side, id: number) => {
    const p = player(s, id);
    const h = history(id);
    return (
      [p.num == null ? '' : `#${n(p.num)}`, p.name].filter(Boolean).join(' ') +
      ` · ${statusText(status(s, id, h))}` +
      h.map((e) => ` · ${minuteStr(e)} ${describe(s, e)}`).join('')
    );
  };
  const open = (s: Side, id: number) => {
    setSelected([s, id]);
    dialogRef.current?.showModal();
  };

  const badges = (h: HistoryEntry[]) => {
    const counts = new Map<BadgeKind, number>();
    for (const e of h) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
    return [...counts].map(([kind, count]) => (
      <span key={kind} className={`lu-tag${count > 1 ? ' lu-has-count' : ''}`}>
        <EventIcon kind={art(kind)} />
        {count > 1 && <sup>{n(count)}</sup>}
      </span>
    ));
  };

  const row = (s: Side, id: number, dir?: 'on' | 'off') => {
    const p = player(s, id);
    const events = history(id).filter((e) => e.kind !== 'on' && e.kind !== 'off');
    return (
      <button
        type="button"
        className={`lu-player-row${dir ? ` lu-${dir}-row` : ''}`}
        aria-label={title(s, id)}
        onClick={() => open(s, id)}
      >
        {dir && <EventIcon kind={dir} className="lu-direction" />}
        <span className="lu-num">{p.num == null ? '' : n(p.num)}</span>
        <bdi className="lu-who">{p.name}</bdi>
        <span className="lu-incidents" aria-hidden="true">
          {events.map((e, i) => (
            <span key={i} className="lu-row-event">
              <EventIcon kind={art(e.kind)} />
              {minute(e)}
            </span>
          ))}
        </span>
      </button>
    );
  };

  const pitch = (s: Side) => {
    const side = sides[s];
    if (!side.rows)
      return (
        <ul className="lu-roster">
          {side.xi.map((id) => (
            <li key={id}>{row(s, id)}</li>
          ))}
        </ul>
      );
    const slots = pitchSlots(side, incidents, view === 'live' && started);
    return (
      <div className="lu-pitch" dir="ltr">
        <svg className="lu-lines" aria-hidden="true" viewBox="0 0 68 105">
          <use href="#mc-field" />
        </svg>
        {slots.map(({ id, dismissed }, idx) => {
          const pos = slotPosition(side.rows!, idx);
          const p = player(s, id);
          const caption = title(s, id);
          return (
            <button
              key={`${idx}-${id}`}
              type="button"
              className={`lu-player${isKeeper(p.pos, pos.line) ? ' lu-keeper' : ''}${dismissed ? ' lu-vacant' : ''}`}
              data-kit-role={isKeeper(p.pos, pos.line) ? 'goalkeeper' : 'player'}
              style={
                {
                  '--x': `${pos.x}%`,
                  '--y': `${pos.y}%`,
                  '--cell': `${pos.cell}%`,
                  ...(isKeeper(p.pos, pos.line) ? kitStyle(lineups[s].colors?.goalkeeper) : {}),
                } as CSSProperties
              }
              title={caption}
              aria-label={caption}
              onClick={() => open(s, id)}
            >
              <span className="lu-kit-wrap">
                {dismissed ? (
                  <span className="lu-vacancy">
                    <EventIcon kind="red" />
                  </span>
                ) : (
                  <>
                    <svg viewBox="0 0 52 44" className="lu-shirt" aria-hidden="true">
                      <use href="#mc-jersey" />
                      <text x="25.8" y="30" textAnchor="middle">
                        {p.num == null ? '' : n(p.num)}
                      </text>
                    </svg>
                    <span className="lu-marks" aria-hidden="true">
                      {badges(history(id))}
                    </span>
                  </>
                )}
              </span>
              <span className="lu-name" dir="auto">
                {dismissed ? t('sent') : p.short || p.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const card = (s: Side) => {
    const side = sides[s];
    const team = teams[s];
    const swaps = incidents.filter((i) => i.kind === 'sub' && i.side === s && i.inId != null);
    const used = new Set(swaps.map((i) => i.inId));
    const unused = side.bench.filter((id) => !used.has(id));
    return (
      <section
        key={s}
        className={`lu-team ${s ? 'lu-away' : 'lu-home'}`}
        data-index={s}
        data-team-id={team.id}
        data-selected={shown === s}
        style={kitStyle(lineups[s].colors?.player)}
      >
        <header className="lu-card-head">
          <div className="lu-card-club">
            <TeamMark
              src={team.logo}
              status={team.logoStatus}
              name={team.name}
              code={team.code}
              primary={team.primary}
              secondary={team.secondary}
              size={26}
            />
            <h2 dir="auto">{team.name}</h2>
          </div>
          <bdi className="lu-shape">{side.formation}</bdi>
        </header>
        <div className="lu-pitch-wrap">{pitch(s)}</div>
        <div className="lu-bench">
          {swaps.length > 0 && (
            <>
              <h3>{t('subs')}</h3>
              <ol className="lu-swaps">
                {swaps.map((i) => (
                  <li key={i.key} className="lu-swap">
                    <time>{minute(i)}</time>
                    <div className="lu-pair">
                      {row(s, i.inId!, 'on')}
                      {i.outId != null && row(s, i.outId, 'off')}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
          <details className="lu-unused">
            <summary>
              {`${t(swaps.length ? 'unused' : 'bench')} (${n(unused.length)})`}
              <EventIcon kind="down" className="lu-chev" />
            </summary>
            <ul>
              {unused.map((id) => (
                <li key={id}>{row(s, id)}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    );
  };

  const canSwitch = started && state === 'full';
  const kinds: BadgeKind[] = ['goal', 'yellow', 'red', 'on', 'off'];
  const sel = selected;
  const selPlayer = sel ? player(sel[0], sel[1]) : null;
  const selHistory = sel ? history(sel[1]) : [];
  const roleText = selPlayer?.role == null ? '' : t(`role${selPlayer.role}` as 'role0');

  return (
    <>
      <Symbols />
      <section className="lu-panel">
        <div className="lu-toolbar">
          <div>
            <h2>{t('title')}</h2>
          </div>
          {canSwitch && (
            <div className="lu-tabs lu-mode" role="group" aria-label={t('formation')}>
              {(['start', 'live'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>
                  {t(k === 'live' && phase === 'finished' ? 'end' : k)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lu-tabs lu-mobile-team" role="group" aria-label={t('select')}>
          {teams.map((tm, i) => (
            <button
              key={tm.id}
              type="button"
              aria-pressed={shown === i}
              onClick={() => setShown(i as Side)}
            >
              {tm.name}
            </button>
          ))}
        </div>
        <ul className="lu-legend" aria-label={t('key')}>
          {kinds.map((k) => (
            <li key={k} className="lu-key-item">
              <EventIcon kind={art(k)} />
              {t(k)}
            </li>
          ))}
        </ul>
        <div className="lu-teams">{[card(0), card(1)]}</div>
      </section>
      <dialog
        ref={dialogRef}
        className="lu-dialog"
        aria-labelledby="mc-lu-detail-name"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        {sel && selPlayer && (
          <>
            <div className="lu-modal-top">
              <div>
                <h2 id="mc-lu-detail-name">{selPlayer.name}</h2>
                <p>
                  {[
                    teams[sel[0]].name,
                    selPlayer.num == null ? '' : `#${n(selPlayer.num)}`,
                    roleText,
                    statusText(status(sel[0], sel[1], selHistory)),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                className="lu-close"
                aria-label={t('close')}
                autoFocus
                onClick={() => dialogRef.current?.close()}
              >
                ×
              </button>
            </div>
            <ul className="lu-detail-list">
              {selHistory.map((e, i) => (
                <li key={i} className="lu-entry">
                  <time>{minute(e)}</time>
                  <EventIcon kind={art(e.kind)} />
                  <span>{describe(sel[0], e)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </dialog>
    </>
  );
}
