'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import type { EditionFormat, ZoneBand } from '@/lib/competitions/formats';
import type { CupRound } from '@/lib/competitions/domestic-ties';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { formatDateLabel } from '@/lib/utils/date';
import { groupFixturesByDay } from '@/lib/competitions/template-model';
import { layoutRounds } from '@/lib/competitions/bracket';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { buildTeamHref } from '@/lib/competitions/paths';
import {
  BEST_THIRDS_SLUG,
  GROUPS_SLUG,
  KNOCKOUT_OPEN_SLUG,
  KNOCKOUT_PATH,
  THIRD_PLACE_SLUG,
  bandForRank,
  buildGroups,
  extraKnockoutRounds,
  groupFixtures,
  groupRules,
  isThirdPlaceRound,
  knockoutDraw,
  twoLeggedSlots,
  knockoutPath,
  rankThirds,
  type GroupRule,
  type GroupTable,
} from '@/lib/competitions/group-stage';
import { TeamMark } from '@/components/shared/TeamMark';
import { IntentLink } from '@/components/shared/IntentLink';
import { CompetitionMatchRow } from './CompetitionBits';
import { LeaguePhaseTable } from './LeaguePhase';
import { DrawWindow } from './CupDraw';
import { StagePicker } from './StagePicker';

type DrawLabels = Parameters<typeof DrawWindow>[0]['labels'];

/** Reference ruleRows colours: direct, play-off / best third, relegation, out. */
const RULE_BAND: Record<GroupRule['key'], ZoneBand['key']> = {
  advance: 'r16',
  promotion: 'r16',
  third: 'playoff',
  playoff: 'playoff',
  relegation: 'relegation',
  stay: 'eliminated',
  out: 'eliminated',
};
const RULE_COLOUR: Record<string, string> = {
  r16: '#6089ad',
  playoff: '#a48bac',
  relegation: '#b38a70',
  eliminated: '#9da5a1',
};

export interface GroupStageInput {
  standings: StandingRow[];
  format: EditionFormat | null;
}

function zonesFor(rules: GroupRule[], size: number): ZoneBand[] {
  const out: ZoneBand[] = [];
  for (let rank = 1; rank <= size; rank++) {
    const key = bandForRank(rules, rank);
    if (key) out.push({ from: rank, to: rank, key: RULE_BAND[key] });
  }
  return out;
}

/** Shared model for the Stages tab and the Overview group table. */
export function useGroupStage(input: GroupStageInput, rounds: CupRound[], locale: Locale) {
  const tT = useTranslations('cupGroups');
  return useMemo(() => {
    const groups = buildGroups(input.standings);
    const path = knockoutPath(rounds, input.format);
    const roundName = (slug: string, r?: CupRound) => {
      const label = r?.label ?? KNOCKOUT_PATH.find((p) => p.slug === slug)?.label ?? slug;
      return localizeRound(label, locale) || label;
    };
    const firstKnockout = path[0] ? roundName(path[0]) : null;
    const ruleText = (rule: GroupRule): string => {
      const v = rule.text.values ?? {};
      if (rule.text.key === 'ruleRound')
        return v.round ? roundName(String(v.round)) : (firstKnockout ?? '');
      if (rule.text.key === 'ruleThirds') return tT('ruleThirds', { n: Number(v.n) });
      if (rule.text.key === 'rulePlayoff')
        return tT('rulePlayoff', { a: String(v.a), b: String(v.b) });
      if (rule.text.key === 'rulePromotion') return tT('rulePromotion', { to: String(v.to) });
      if (rule.text.key === 'ruleRelegation') return tT('ruleRelegation', { to: String(v.to) });
      if (rule.text.key === 'ruleStay') return tT('ruleStay', { league: String(v.league) });
      return tT('ruleOut');
    };
    const rulesFor = (g: GroupTable | undefined) =>
      g ? groupRules(input.format, path[0] ?? null, g.division, g.rows.length) : [];
    return { groups, path, roundName, ruleText, rulesFor };
  }, [input, rounds, locale, tT]);
}

function RulesPanel({
  rules,
  text,
  title,
}: {
  rules: GroupRule[];
  text: (r: GroupRule) => string;
  title: string;
}) {
  if (rules.length === 0) return null;
  return (
    <section className="pl-summary cup-rules-panel">
      <div className="pl-head">
        <h2>{title}</h2>
      </div>
      <div className="cup-rules">
        {rules.map((r) => (
          <div
            key={`${r.range}-${r.key}`}
            className="cup-rule"
            style={{ ['--band' as string]: RULE_COLOUR[RULE_BAND[r.key]] } as React.CSSProperties}
          >
            <span className="cup-rank">{r.range}</span>
            <span>{text(r)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function groupOptionLabel(g: GroupTable, tT: ReturnType<typeof useTranslations>): string {
  if (g.division) {
    const n = /group\s+(\d+)/i.exec(g.label)?.[1];
    return n ? `${tT('leagueDivision', { d: g.division })} · ${tT('groupN', { n })}` : g.label;
  }
  const letter = /^(?:group\s+)?([a-z0-9]{1,2})$/i.exec(g.label)?.[1];
  return letter ? tT('groupN', { n: letter }) : g.label;
}

/** Group picker(s): one menu, or League then Group for the Nations League divisions. */
function GroupPickers({
  groups,
  current,
  hrefFor,
  onSelect,
}: {
  groups: GroupTable[];
  current: GroupTable;
  hrefFor: (slug: string) => string;
  onSelect: (slug: string) => void;
}) {
  const tT = useTranslations('cupGroups');
  const divisions = [...new Set(groups.map((g) => g.division).filter((d): d is string => !!d))];
  const inDivision = current.division
    ? groups.filter((g) => g.division === current.division)
    : groups;
  return (
    <>
      {divisions.length > 1 ? (
        <StagePicker
          label={tT('league')}
          current={current.division ?? ''}
          options={divisions.map((d) => ({ slug: d, label: tT('leagueDivision', { d }) }))}
          hrefFor={(d) => hrefFor(groups.find((g) => g.division === d)?.slug ?? current.slug)}
          onSelect={(d) => onSelect(groups.find((g) => g.division === d)?.slug ?? current.slug)}
        />
      ) : null}
      {inDivision.length > 1 ? (
        <StagePicker
          label={tT('group')}
          current={current.slug}
          options={inDivision.map((g) => ({ slug: g.slug, label: groupOptionLabel(g, tT) }))}
          hrefFor={hrefFor}
          onSelect={onSelect}
        />
      ) : null}
    </>
  );
}

/** Overview side card: "Group standings" with its own group menu (reference phaseTable). */
export function GroupSummary({
  input,
  rounds,
  locale,
  hrefFor,
}: {
  input: GroupStageInput;
  rounds: CupRound[];
  locale: Locale;
  hrefFor: (slug: string) => string;
}) {
  const tT = useTranslations('cupGroups');
  const tCup = useTranslations('domesticCup');
  const model = useGroupStage(input, rounds, locale);
  const [slug, setSlug] = useState(model.groups[0]?.slug ?? '');
  const group = model.groups.find((g) => g.slug === slug) ?? model.groups[0];
  if (!group) return null;
  const single = model.groups.length === 1;
  const rules = model.rulesFor(group);
  return (
    <section className="pl-summary">
      <div className="pl-head">
        <h2>{single ? tCup('leaguePhaseStandings') : tT('groupStandings')}</h2>
        {single ? null : (
          <GroupPickers
            groups={model.groups}
            current={group}
            hrefFor={hrefFor}
            onSelect={setSlug}
          />
        )}
      </div>
      <LeaguePhaseTable
        standings={group.rows}
        zones={zonesFor(rules, group.rows.length)}
        locale={locale}
        caption={groupOptionLabel(group, tT)}
      />
    </section>
  );
}

export function TournamentStages({
  input,
  rounds,
  fixtures,
  locale,
  initialSlug,
  hrefFor,
  whenRail,
  labels,
}: {
  input: GroupStageInput;
  rounds: CupRound[];
  fixtures: FixtureWithTeams[];
  locale: Locale;
  initialSlug: string | null;
  hrefFor: (slug: string) => string;
  whenRail: ReactNode;
  labels: DrawLabels;
}) {
  const t = useTranslations('leaguePage');
  const tT = useTranslations('cupGroups');
  const tCup = useTranslations('domesticCup');
  const model = useGroupStage(input, rounds, locale);
  const { groups, path, roundName } = model;
  const extra = useMemo(() => extraKnockoutRounds(rounds), [rounds]);
  const thirdRound = rounds.find((r) => isThirdPlaceRound(r.slug));
  const hasThirdPlace = !!thirdRound || !!input.format?.thirdPlaceMatch;
  const thirdsAdvance = input.format?.bestThirdsAdvance ?? 0;
  const showThirds = thirdsAdvance > 0 && groups.length > 1;

  const options = [
    ...extra.map((r) => ({ slug: r.slug, label: roundName(r.slug, r) })),
    ...(groups.length
      ? [{ slug: GROUPS_SLUG, label: groups.length === 1 ? tCup('leaguePhase') : tT('groupStage') }]
      : []),
    ...(showThirds ? [{ slug: BEST_THIRDS_SLUG, label: tT('bestThirds') }] : []),
    ...path.map((slug) => ({
      slug,
      label: roundName(
        slug,
        rounds.find((r) => r.slug === slug),
      ),
    })),
    ...(hasThirdPlace ? [{ slug: THIRD_PLACE_SLUG, label: tT('thirdPlace') }] : []),
  ];

  // Initial stage: an asked-for stage or group, else the live/next knockout round, else the groups.
  const [stage, setStage] = useState<string>(() => {
    const s = initialSlug ?? '';
    if (groups.some((g) => g.slug === s)) return GROUPS_SLUG;
    if (s === KNOCKOUT_OPEN_SLUG) return path[0] ?? GROUPS_SLUG;
    if (isThirdPlaceRound(s)) return THIRD_PLACE_SLUG;
    if (options.some((o) => o.slug === s)) return s;
    const playedKnockout = rounds.some((r) => path.includes(r.slug) && r.fixtures.length > 0);
    if (playedKnockout) {
      const latest = [...path]
        .reverse()
        .find((slug) => rounds.some((r) => r.slug === slug && r.fixtures.length > 0));
      return latest ?? path[0];
    }
    return groups.length ? GROUPS_SLUG : (options[0]?.slug ?? '');
  });
  const [groupSlug, setGroupSlug] = useState<string>(
    () => groups.find((g) => g.slug === initialSlug)?.slug ?? groups[0]?.slug ?? '',
  );
  const group = groups.find((g) => g.slug === groupSlug) ?? groups[0];

  function go(slug: string) {
    window.history.replaceState(null, '', hrefFor(slug));
  }
  function selectStage(slug: string) {
    setStage(slug);
    go(slug === GROUPS_SLUG && group ? group.slug : slug);
  }
  function selectGroup(slug: string) {
    setStage(GROUPS_SLUG);
    setGroupSlug(slug);
    go(slug);
  }
  const stageHref = (slug: string) => hrefFor(slug === GROUPS_SLUG && group ? group.slug : slug);

  const stagePicker = (
    <StagePicker
      label={tCup('stage')}
      current={stage}
      options={options}
      hrefFor={stageHref}
      onSelect={selectStage}
    />
  );

  const rules = model.rulesFor(group);
  const rulesPanel = <RulesPanel rules={rules} text={model.ruleText} title={tCup('whatNext')} />;
  const todayLabel = t('today');

  let main: ReactNode;
  let side: ReactNode = null;
  if (stage === GROUPS_SLUG && group) {
    const matches = groupFixtures(fixtures, group);
    const days = groupFixturesByDay(matches);
    main = (
      <>
        <section>
          <div className="cup-controls">
            {stagePicker}
            <GroupPickers
              groups={groups}
              current={group}
              hrefFor={hrefFor}
              onSelect={selectGroup}
            />
          </div>
          <LeaguePhaseTable
            standings={group.rows}
            zones={zonesFor(rules, group.rows.length)}
            locale={locale}
            caption={groupOptionLabel(group, tT)}
          />
        </section>
        <div className="pl-mobile-top">{rulesPanel}</div>
        {days.length > 0 ? (
          <section>
            <div className="pl-head">
              <h2>{t('viewFixtures')}</h2>
            </div>
            {days.map((d) => (
              <div key={d.key} className="cup-date-group">
                <h3 className="ghead cup-day-head">
                  <strong>{formatDateLabel(d.key, locale, todayLabel)}</strong>
                </h3>
                {d.fixtures.map((f) => (
                  <CompetitionMatchRow key={f.id} fixture={f} locale={locale} />
                ))}
              </div>
            ))}
          </section>
        ) : null}
      </>
    );
    side = rulesPanel;
  } else if (stage === GROUPS_SLUG) {
    main = (
      <section>
        <div className="cup-controls">{stagePicker}</div>
        <p className="pl-empty">{t('comingSoon')}</p>
      </section>
    );
  } else if (stage === BEST_THIRDS_SLUG) {
    const thirds = rankThirds(groups, thirdsAdvance);
    main = (
      <section>
        <div className="cup-controls">
          {stagePicker}
          <span className="cup-meta">{tT('topAdvance', { n: thirdsAdvance })}</span>
        </div>
        {thirds.length === 0 ? (
          <p className="pl-empty">{t('comingSoon')}</p>
        ) : (
          <table className="cup-table thirds-table" aria-label={tT('bestThirds')}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">{t('team')}</th>
                <th scope="col">{tT('group')}</th>
                <th scope="col">
                  <abbr title={t('colPlayedFull')}>{t('colPlayed')}</abbr>
                </th>
                <th scope="col">
                  <abbr title={t('colGoalDiffFull')}>{t('colGoalDiff')}</abbr>
                </th>
                <th scope="col">{tT('colGF')}</th>
                <th scope="col">
                  <abbr title={t('colPointsFull')}>{t('colPoints')}</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {thirds.map((x) => {
                const team = x.row.team;
                const name = team ? getTeamDisplayName(team, locale) : '—';
                const g = groups.find((gr) => gr.label === x.group);
                const crest = (
                  <TeamMark
                    className="mark cup-mark"
                    src={team?.logoUrl}
                    status={team?.logoStatus}
                    name={team?.name}
                    shortName={team?.shortName}
                    code={team?.code}
                    primary={team?.primaryColor}
                    secondary={team?.secondaryColor}
                    isNational={team?.isNational}
                    countryCode={team?.countryCode}
                    sizeVar="21px"
                  />
                );
                const gd = x.row.goalDiff ?? 0;
                return (
                  <tr
                    key={`${x.group}-${x.row.teamId}`}
                    className={x.rank === thirdsAdvance ? 'last-qualifier' : undefined}
                  >
                    <td
                      aria-label={`${x.rank} · ${x.qualifies ? tT('qualifies') : tT('eliminated')}`}
                    >
                      {x.rank}
                    </td>
                    <th scope="row">
                      {team?.slug ? (
                        <IntentLink
                          className="cup-teamlink"
                          href={buildTeamHref(locale, team.slug)}
                        >
                          {crest}
                          <bdi>{name}</bdi>
                        </IntentLink>
                      ) : (
                        <span className="cup-teamlink">
                          {crest}
                          <bdi>{name}</bdi>
                        </span>
                      )}
                    </th>
                    <td>
                      {g ? (/^(?:group\s+)?(\S{1,2})$/i.exec(g.label)?.[1] ?? g.label) : x.group}
                    </td>
                    <td>{x.row.played}</td>
                    <td>
                      <bdi dir="ltr">{gd > 0 ? `+${gd}` : gd}</bdi>
                    </td>
                    <td>{x.row.goalsFor ?? 0}</td>
                    <td>{x.row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    );
    side = rulesPanel;
  } else {
    const isExtra = extra.some((r) => r.slug === stage);
    const isThird = stage === THIRD_PLACE_SLUG;
    let drawRounds;
    if (isExtra) {
      drawRounds = layoutRounds(extra.map((r) => ({ ...r, label: roundName(r.slug, r) })));
    } else {
      const draw = knockoutDraw(rounds, path, roundName, twoLeggedSlots(input.format ?? null));
      if (isThird) {
        const semis = draw.find((r) => r.slug === 'semi-finals');
        const third = layoutRounds([
          {
            slug: THIRD_PLACE_SLUG,
            label: tT('thirdPlace'),
            earlier: false,
            twoLegged: false,
            ties: thirdRound?.ties ?? [],
          },
        ])[0];
        drawRounds = semis ? [semis, third] : [third];
      } else {
        drawRounds = draw;
      }
    }
    main =
      drawRounds.length === 0 ? (
        <section>
          <div className="cup-controls">{stagePicker}</div>
          <p className="pl-empty">{t('comingSoon')}</p>
        </section>
      ) : (
        <>
          <DrawWindow
            rounds={drawRounds}
            currentSlug={stage}
            locale={locale}
            hrefFor={stageHref}
            onSelect={selectStage}
            picker={stagePicker}
            labels={labels}
          />
          {hasThirdPlace && !isExtra ? (
            <div className="draw-placement">
              <a
                className="link"
                href={stageHref(isThird ? 'final' : THIRD_PLACE_SLUG)}
                onClick={(e) => {
                  e.preventDefault();
                  selectStage(isThird ? 'final' : THIRD_PLACE_SLUG);
                }}
              >
                {isThird ? roundName('final') : tT('thirdPlace')} →
              </a>
            </div>
          ) : null}
        </>
      );
  }

  return (
    <>
      <div className="pl-main">{main}</div>
      <aside className="pl-side pl-aux-desktop">
        {whenRail}
        {side}
      </aside>
    </>
  );
}
