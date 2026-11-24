const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const CRICKET_API_KEY =
  process.env.CRICKET_API_KEY || 'UIKB9bVP110kBO6FKokI5yn2MMjsNTM2SLKWm1kFkPT2p8qdZl6OKHs711n4';

const CUSTOM_API_URL = process.env.CRICKET_API_URL || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const fallbackMatches = [
  {
    id: 'ind-aus-1',
    series: 'T20 International Series',
    matchTitle: 'Match 1',
    status: 'LIVE',
    timeLabel: 'Live • Analytics Feed',
    teamA: 'IND',
    teamB: 'AUS',
    runsA: 168,
    wicketsA: 3,
    oversA: '17.2',
    runsB: 0,
    wicketsB: 0,
    oversB: '0.0',
    venue: 'Wankhede Stadium, Mumbai',
    pitchType: 'Batting Friendly',
    avgScore: '186',
    ai: {
      probA: 64,
      probB: 36,
      crowdA: 57,
      projRange: '15Ov: ~145 | 20Ov: ~194',
      sessionRange: '6Ov: 48-55 | 10Ov: 82-94',
      momentum: 'IND Ahead • CRR 9.69'
    },
    h2hPlayers: [
      { name: 'Suryakumar Yadav', role: 'Batter', tag: 'C', reason: 'Strong scoring rate in middle and death overs.' },
      { name: 'Jasprit Bumrah', role: 'Bowler', tag: 'VC', reason: 'High wicket threat with new ball and at death.' },
      { name: 'Hardik Pandya', role: 'All-Rounder', tag: 'Safe', reason: 'Dual impact with bat and overs.' }
    ],
    glPlayers: [
      { name: 'Axar Patel', role: 'All-Rounder', tag: 'GL C', reason: 'Spin matchup advantage and handy lower-order runs.' },
      { name: 'Travis Head', role: 'Batter', tag: 'GL VC', reason: 'High-impact powerplay hitter for differential upside.' },
      { name: 'Arshdeep Singh', role: 'Bowler', tag: 'Diff', reason: 'Swing and death-over wicket potential.' }
    ],
    commentary: [
      { over: '17.2', text: 'Single taken into the off-side; strike rotates smoothly.' },
      { over: '17.1', text: 'Clean hit over deep mid-wicket for six runs.' },
      { over: '16.6', text: 'Driven past cover for four.' }
    ]
  },
  {
    id: 'csk-mi-2',
    series: 'League Clash',
    matchTitle: 'Match 2',
    status: 'UPCOMING',
    timeLabel: 'Upcoming • Pre-Match Intel',
    teamA: 'CSK',
    teamB: 'MI',
    runsA: 0,
    wicketsA: 0,
    oversA: '0.0',
    runsB: 0,
    wicketsB: 0,
    oversB: '0.0',
    venue: 'MA Chidambaram Stadium, Chennai',
    pitchType: 'Spin & Grip',
    avgScore: '172',
    ai: {
      probA: 52,
      probB: 48,
      crowdA: 54,
      projRange: '15Ov: ~128 | 20Ov: ~172',
      sessionRange: '6Ov: 44-51 | 10Ov: 76-88',
      momentum: 'Balanced'
    },
    h2hPlayers: [
      { name: 'Ruturaj Gaikwad', role: 'Batter', tag: 'C', reason: 'Consistent top-order anchor on slow surfaces.' },
      { name: 'Jasprit Bumrah', role: 'Bowler', tag: 'VC', reason: 'Economical spells across phases.' }
    ],
    glPlayers: [
      { name: 'Ravindra Jadeja', role: 'All-Rounder', tag: 'GL C', reason: 'Strong spin control and middle-order value.' },
      { name: 'Tilak Varma', role: 'Batter', tag: 'GL VC', reason: 'Effective against spin in middle overs.' }
    ],
    commentary: [
      { over: 'PRE', text: 'Pitch surface shows grip for spinners as evening progresses.' }
    ]
  }
];

function parseScoreString(scoreStr) {
  if (!scoreStr || typeof scoreStr !== 'string') {
    return { runs: 0, wickets: 0, overs: '0.0' };
  }
  const match = scoreStr.match(/(\d+)\s*\/\s*(\d+)\s*(?:\(([^)]+)\))?/);
  if (!match) {
    const runsOnly = scoreStr.match(/(\d+)/);
    return {
      runs: runsOnly ? Number(runsOnly[1]) : 0,
      wickets: 0,
      overs: '0.0'
    };
  }
  return {
    runs: Number(match[1] || 0),
    wickets: Number(match[2] || 0),
    overs: match[3] ? String(match[3]).trim() : '0.0'
  };
}

function oversToDecimal(oversStr) {
  const parts = String(oversStr || '0').split('.');
  const whole = Number(parts[0]) || 0;
  const balls = Number(parts[1]) || 0;
  return whole + balls / 6;
}

function shortTeamCode(name, fallback) {
  if (!name) return fallback;
  const clean = String(name).trim();
  const parenMatch = clean.match(/\(([A-Za-z0-9]{2,5})\)/);
  if (parenMatch) return parenMatch[1].toUpperCase();
  const words = clean.replace(/[^A-Za-z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function clampPercent(val, fallback) {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.max(8, Math.min(92, Math.round(num)));
}

function computeAnalytics(runs, wickets, oversStr, isLive) {
  const ovDec = oversToDecimal(oversStr);
  if (!isLive || ovDec <= 0.1) {
    return {
      probA: 52,
      probB: 48,
      crowdA: 54,
      projRange: '15Ov: ~128 | 20Ov: ~172',
      sessionRange: '6Ov: 44-51 | 10Ov: 76-88',
      momentum: 'Pre-Match / Balanced'
    };
  }

  const crr = runs / ovDec;
  const proj15 = Math.round(crr * 15);
  const proj20 = Math.round(crr * 20);
  const sess6Min = Math.max(20, Math.round(crr * 6 - 5));
  const sess6Max = Math.max(sess6Min + 6, Math.round(crr * 6 + 6));
  const sess10Min = Math.max(35, Math.round(crr * 10 - 8));
  const sess10Max = Math.max(sess10Min + 8, Math.round(crr * 10 + 9));

  const probA = clampPercent(50 + (crr - 7.5) * 4 - wickets * 2.2, 50);
  const probB = 100 - probA;

  return {
    probA,
    probB,
    crowdA: clampPercent(probA - 3, 52),
    projRange: `15Ov: ~${proj15} | 20Ov: ~${proj20}`,
    sessionRange: `6Ov: ${sess6Min}-${sess6Max} | 10Ov: ${sess10Min}-${sess10Max}`,
    momentum: `CRR ${crr.toFixed(2)} • ${wickets} Wkts Down`
  };
}

function normalizeMatchItem(item, index, sourceTag) {
  const base = fallbackMatches[index % fallbackMatches.length];

  const rawTeamA = item?.t1 || item?.teamA || item?.teams?.[0] || base.teamA;
  const rawTeamB = item?.t2 || item?.teamB || item?.teams?.[1] || base.teamB;

  const teamA = shortTeamCode(rawTeamA, base.teamA);
  const teamB = shortTeamCode(rawTeamB, base.teamB);

  let parsedA = { runs: 0, wickets: 0, overs: '0.0' };
  let parsedB = { runs: 0, wickets: 0, overs: '0.0' };

  if (Array.isArray(item?.score) && item.score.length > 0) {
    parsedA = {
      runs: Number(item.score[0]?.r ?? 0),
      wickets: Number(item.score[0]?.w ?? 0),
      overs: String(item.score[0]?.o ?? '0.0')
    };
    if (item.score[1]) {
      parsedB = {
        runs: Number(item.score[1]?.r ?? 0),
        wickets: Number(item.score[1]?.w ?? 0),
        overs: String(item.score[1]?.o ?? '0.0')
      };
    }
  } else {
    parsedA = parseScoreString(item?.t1s || item?.scoreA || '');
    parsedB = parseScoreString(item?.t2s || item?.scoreB || '');
  }

  const statusText = String(item?.status || item?.ms || '').toLowerCase();
  const isUpcoming =
    item?.matchStarted === false ||
    statusText.includes('not started') ||
    statusText.includes('upcoming');
  const status = isUpcoming ? 'UPCOMING' : 'LIVE';

  const analytics = computeAnalytics(parsedA.runs, parsedA.wickets, parsedA.overs, status === 'LIVE');

  const latestBallNote = item?.status
    ? `${parsedA.overs || 'Live'}: ${item.status}`
    : `${parsedA.overs || 'Live'}: ${teamA} ${parsedA.runs}/${parsedA.wickets}.`;

  return {
    id: String(item?.id || `live-match-${index + 1}`),
    series: String(item?.series || item?.name || base.series),
    matchTitle: String(item?.name || `${teamA} vs ${teamB}`),
    status,
    timeLabel: `${status} • ${sourceTag}`,
    teamA,
    teamB,
    runsA: parsedA.runs,
    wicketsA: parsedA.wickets,
    oversA: parsedA.overs,
    runsB: parsedB.runs,
    wicketsB: parsedB.wickets,
    oversB: parsedB.overs,
    venue: String(item?.venue || base.venue),
    pitchType: base.pitchType,
    avgScore: base.avgScore,
    ai: analytics,
    h2hPlayers: base.h2hPlayers,
    glPlayers: base.glPlayers,
    commentary: [
      { over: parsedA.overs || 'LIVE', text: latestBallNote },
      ...base.commentary
    ]
  };
}

async function fetchFromUrl(url, sourceTag) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;

    const payload = await res.json();
    const list = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : payload?.matches;

    if (!Array.isArray(list) || list.length === 0) return null;

    const sorted = [...list].sort((a, b) => {
      const aLive = a?.matchStarted === true && a?.matchEnded === false ? 1 : 0;
      const bLive = b?.matchStarted === true && b?.matchEnded === false ? 1 : 0;
      return bLive - aLive;
    });

    return sorted.slice(0, 8).map((item, idx) => normalizeMatchItem(item, idx, sourceTag));
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLiveMatches() {
  const candidates = [];

  if (CUSTOM_API_URL) {
    const customWithKey = CUSTOM_API_URL.includes('apikey=')
      ? CUSTOM_API_URL
      : `${CUSTOM_API_URL}${CUSTOM_API_URL.includes('?') ? '&' : '?'}apikey=${encodeURIComponent(CRICKET_API_KEY)}`;
    candidates.push({ url: customWithKey, tag: 'Custom API' });
  }

  if (CRICKET_API_KEY) {
    const keyEnc = encodeURIComponent(CRICKET_API_KEY);
    candidates.push({
      url: `https://api.cricapi.com/v1/cricScore?apikey=${keyEnc}&offset=0`,
      tag: 'CricketData Live'
    });
    candidates.push({
      url: `https://api.cricapi.com/v1/currentMatches?apikey=${keyEnc}&offset=0`,
      tag: 'CricketData Current'
    });
  }

  for (const c of candidates) {
    const result = await fetchFromUrl(c.url, c.tag);
    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
  }

  return fallbackMatches;
}

app.get('/api/matches', async (req, res) => {
  const data = await fetchLiveMatches();
  res.json(data);
});

app.post('/api/chat', async (req, res) => {
  const { matchId, question } = req.body || {};
  const matches = await fetchLiveMatches();
  const match = matches.find((m) => m.id === matchId) || matches[0];
  const qText = String(question || 'match outlook').trim();

  const topH2H = match.h2hPlayers?.[0]?.name || 'Key Batter';
  const topGL = match.glPlayers?.[0]?.name || 'Differential Pick';

  const reply =
    `${match.teamA} vs ${match.teamB} (${qText}): ` +
    `Win model reads ${match.teamA} ${match.ai.probA}% vs ${match.teamB} ${match.ai.probB}%. ` +
    `${match.ai.projRange} | ${match.ai.sessionRange}. ` +
    `H2H focus: ${topH2H}; GL differential: ${topGL}. (Analytics only)`;

  res.json({ reply });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CricNawab-AI running on port ${PORT}`);
});
