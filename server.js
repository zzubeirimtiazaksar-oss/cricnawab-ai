const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const CRICKET_API_URL = process.env.CRICKET_API_URL || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let matches = [
  {
    id: 101,
    status: "LIVE",
    series: "International T20 Series",
    matchTitle: "3rd T20I • Mumbai",
    timeLabel: "Live Match • Wankhede Stadium",
    teamA: "IND",
    teamAFull: "India",
    runsA: 168,
    wicketsA: 3,
    oversA: "17.2",
    teamB: "AUS",
    teamBFull: "Australia",
    runsB: 0,
    wicketsB: 0,
    oversB: "0.0",
    venue: "Wankhede Stadium, Mumbai",
    avgScore: 186,
    pitchType: "Batting Friendly • Even Bounce",
    weather: "29°C • Clear Night",
    paceHelp: 64,
    tossNote: "Chasing teams hold a 56% win advantage under lights",
    h2h: "IND 19 - 15 AUS",
    xiA: ["Y. Jaiswal", "A. Sharma", "S. Yadav (C)", "T. Varma", "H. Pandya", "R. Singh", "A. Patel", "J. Bumrah", "A. Singh", "R. Bishnoi", "V. Chakaravarthy"],
    xiB: ["T. Head", "M. Marsh (C)", "J. Inglis", "G. Maxwell", "M. Stoinis", "T. David", "M. Short", "S. Abbott", "N. Ellis", "A. Zampa", "J. Hazlewood"],
    recentBalls: ["4", "1", "6", "2", "1", "0"],
    commentary: [
      { over: "17.2", text: "Driven firmly through extra cover for a single." },
      { over: "17.1", text: "FOUR! Cleanly timed past mid-off for a boundary." },
      { over: "16.6", text: "SIX! Pulled into the stands over deep mid-wicket." },
      { over: "16.5", text: "Two runs taken into the deep backward square leg gap." }
    ],
    h2hPlayers: [
      { name: "Suryakumar Yadav", role: "BAT", tag: "C", reason: "Strong death-over strike rate and high venue consistency" },
      { name: "Jasprit Bumrah", role: "BOWL", tag: "VC", reason: "Controlled economy and high wicket threat in key overs" },
      { name: "Hardik Pandya", role: "ALL", tag: "", reason: "Balanced fantasy points from middle/death overs and batting" },
      { name: "Travis Head", role: "BAT", tag: "", reason: "Fast powerplay scoring rate against new-ball bowlers" },
      { name: "Axar Patel", role: "ALL", tag: "", reason: "Economical spin overs plus lower-order batting value" }
    ],
    glPlayers: [
      { name: "Abhishek Sharma", role: "BAT", tag: "C", reason: "High-ceiling differential opener with big innings potential" },
      { name: "Arshdeep Singh", role: "BOWL", tag: "VC", reason: "Swing up front and death-over wicket upside" },
      { name: "Marcus Stoinis", role: "ALL", tag: "", reason: "Power hitter with handy middle-overs bowling" },
      { name: "Rinku Singh", role: "BAT", tag: "", reason: "Late-innings boundary acceleration upside" },
      { name: "Nathan Ellis", role: "BOWL", tag: "", reason: "Slower-ball variations suited to this surface" }
    ]
  },
  {
    id: 102,
    status: "UPCOMING",
    series: "Premier T20 League",
    matchTitle: "Match 14 • Chennai",
    timeLabel: "7:30 PM IST • Toss at 7:00 PM",
    teamA: "CSK",
    teamAFull: "Chennai Super Kings",
    runsA: 0,
    wicketsA: 0,
    oversA: "0.0",
    teamB: "MI",
    teamBFull: "Mumbai Indians",
    runsB: 0,
    wicketsB: 0,
    oversB: "0.0",
    venue: "MA Chidambaram Stadium, Chennai",
    avgScore: 172,
    pitchType: "Spin Grip • Slow Turn in Middle Overs",
    weather: "31°C • Humid Evening",
    paceHelp: 38,
    tossNote: "Batting first preferred when surface slows down",
    h2h: "MI 20 - 17 CSK",
    xiA: ["R. Gaikwad (C)", "D. Conway", "R. Tripathi", "S. Dube", "R. Jadeja", "M. Dhoni", "S. Curran", "R. Ashwin", "N. Ahmad", "M. Pathirana", "K. Ahmed"],
    xiB: ["R. Sharma", "R. Rickelton", "S. Yadav", "T. Varma", "H. Pandya (C)", "N. Dhir", "M. Santner", "D. Chahar", "J. Bumrah", "T. Boult", "K. Sharma"],
    recentBalls: ["-", "-", "-", "-", "-", "-"],
    commentary: [
      { over: "PRE", text: "Pitch report indicates spin grip during overs 7 to 15." },
      { over: "PRE", text: "Top-order anchors and spin all-rounders carry strong match value." }
    ],
    h2hPlayers: [
      { name: "Ruturaj Gaikwad", role: "BAT", tag: "C", reason: "Reliable top-order run scorer at Chepauk" },
      { name: "Ravindra Jadeja", role: "ALL", tag: "VC", reason: "4 spin overs plus dependable middle/lower-order runs" },
      { name: "Jasprit Bumrah", role: "BOWL", tag: "", reason: "Consistent wicket-taker in powerplay and death phases" },
      { name: "Suryakumar Yadav", role: "BAT", tag: "", reason: "High-impact middle-overs scorer" },
      { name: "Matheesha Pathirana", role: "BOWL", tag: "", reason: "Death-over breakthrough specialist" }
    ],
    glPlayers: [
      { name: "Shivam Dube", role: "ALL", tag: "C", reason: "Strong middle-overs six-hitter against spin" },
      { name: "Noor Ahmad", role: "BOWL", tag: "VC", reason: "Wrist-spin wicket potential on a turning track" },
      { name: "Tilak Varma", role: "BAT", tag: "", reason: "Composed middle-order accumulator" },
      { name: "Mitchell Santner", role: "ALL", tag: "", reason: "Economical left-arm spin plus handy batting" },
      { name: "Deepak Chahar", role: "BOWL", tag: "", reason: "Early powerplay swing threat" }
    ]
  }
];

function buildAIModel(m) {
  const oversNum = parseFloat(m.oversA) || 0;
  let probA = 54;

  if (m.status === "LIVE" && oversNum > 0) {
    const crr = m.runsA / oversNum;
    const rateDiff = (crr - 8.2) * 4.0;
    const wicketImpact = m.wicketsA * 3.5;
    probA = Math.round(52 + rateDiff - wicketImpact);
    probA = Math.max(10, Math.min(90, probA));
  }

  const crr = oversNum > 0 ? (m.runsA / oversNum).toFixed(2) : "8.60";
  const projCenter = oversNum > 0
    ? Math.round((m.runsA / oversNum) * 20 - m.wicketsA * 1.5)
    : m.avgScore;
  const projLow = Math.max(130, projCenter - 4);
  const projHigh = Math.max(140, projCenter + 5);
  const sessionLow = Math.max(32, Math.round(projCenter * 0.27));
  const sessionHigh = Math.max(40, Math.round(projCenter * 0.32));

  let momentum = `Balanced (${m.teamA} vs ${m.teamB})`;
  if (probA >= 62) momentum = `${m.teamA} Ahead (+${probA - 50} pts)`;
  else if (probA <= 42) momentum = `${m.teamB} Ahead (+${50 - probA} pts)`;

  const crowdA = Math.max(15, Math.min(85, probA + (probA >= 50 ? 3 : -3)));

  return {
    probA,
    probB: 100 - probA,
    crowdA,
    crowdB: 100 - crowdA,
    crr,
    projRange: `${projLow} - ${projHigh}`,
    sessionRange: `${sessionLow} - ${sessionHigh}`,
    momentum,
    paceSpin: `${m.paceHelp}% Pace / ${100 - m.paceHelp}% Spin`
  };
}

async function syncExternalFeed() {
  if (!CRICKET_API_URL || typeof fetch !== 'function') return;
  try {
    const res = await fetch(CRICKET_API_URL);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      matches = data;
    }
  } catch (err) {
    // Keep clean local data if external API is not configured
  }
}

setInterval(syncExternalFeed, 15000);

app.get('/api/matches', (req, res) => {
  res.json(matches.map(m => ({ ...m, ai: buildAIModel(m) })));
});

app.post('/api/chat', (req, res) => {
  const { matchId, question } = req.body || {};
  const m = matches.find(x => x.id === Number(matchId)) || matches[0];
  const ai = buildAIModel(m);
  const q = String(question || "").toLowerCase();

  let reply = "";
  if (q.includes("pitch") || q.includes("venue") || q.includes("weather") || q.includes("toss")) {
    reply = `${m.venue}: Pitch "${m.pitchType}", Avg 1st Inn ${m.avgScore}, Split ${ai.paceSpin}, Weather ${m.weather}. ${m.tossNote}.`;
  } else if (q.includes("c & vc") || q.includes("captain") || q.includes("vc") || q.includes("fantasy") || q.includes("team")) {
    reply = `H2H Picks: ${m.h2hPlayers[0].name} (C) & ${m.h2hPlayers[1].name} (VC). Grand League Differential: ${m.glPlayers[0].name} (${m.glPlayers[0].reason}).`;
  } else if (q.includes("win") || q.includes("prob") || q.includes("score") || q.includes("session") || q.includes("jeet")) {
    reply = `AI Signals: ${m.teamA} ${ai.probA}% vs ${m.teamB} ${ai.probB}% | Projected Score: ${ai.projRange} | Next Phase: ${ai.sessionRange} | ${ai.momentum}.`;
  } else {
    reply = `${m.teamA} vs ${m.teamB} (${m.venue}): Win split ${ai.probA}% - ${ai.probB}%, projected ${ai.projRange}, top C pick ${m.h2hPlayers[0].name}.`;
  }

  res.json({ reply });
});

app.listen(PORT, () => {
  console.log(`CricNawab-AI running on http://localhost:${PORT}`);
});