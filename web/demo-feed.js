/* Hermes Agent Office — in-browser demo feed.
 * When no office server is reachable (static hosting, GitHub Pages, file://),
 * this generates the same event stream the Python server would, entirely
 * client-side. Lets anyone click a link and see the office in action.
 */
'use strict';

const CLIENT_DEMO_NAMES = ['Uma', 'Xyla', 'Hazel', 'Dash', 'Pixel', 'Coco'];

function startClientDemo(handleEvent, onStatus) {
  let n = 0;
  let last = Date.now();
  const ev = (type, agent, extra = {}) => {
    n += 1;
    last += 120 + Math.random() * 500;
    handleEvent(Object.assign({
      id: n,
      ts: last / 1000,
      type,
      agent,
      agent_id: 'demo-' + agent.toLowerCase(),
      session: 'demo-' + agent.toLowerCase(),
      role: 'telegram',
      status: type,
    }, extra));
  };
  const tools = ['web_search', 'web_extract', 'web_search', 'browser_open', 'web_search'];
  const tasks = [
    'Find the cheapest verified flights to Tokyo next month',
    'Summarize this week’s AI news into a short brief',
    'Back up the knowledge base to git',
    'Draft a reply to the customer about the pricing question',
  ];
  const idle = ['Waiting at desk for your next prompt', 'Filing yesterday’s notes', 'Reading the docs'];

  let i = 0;
  const spawn = (name) => {
    // never spawn a name already in the office (theme-switch + wave races
    // caused duplicate characters on the roster)
    if (window.__eng && [...window.__eng.agents.values()].some(a => a.name === name)) return;
    const task = tasks[i % tasks.length];
    i += 1;
    ev('agent_enter', name, { task });
    setTimeout(() => ev('thinking', name, { text: 'Understanding the request…', task }), 1500);
    let t = 3000;
    for (const tool of tools) {
      setTimeout(() => ev('tool_call', name, {
        tool, task,
        tokens: { input: Math.round(300 + Math.random() * 1500), output: Math.round(100 + Math.random() * 600) },
      }), t);
      t += 1800 + Math.random() * 2200;
    }
    setTimeout(() => ev('thinking', name, { text: 'Writing up the deliverable…', task }), t);
    setTimeout(() => ev('delivery', name, {
      title: task,
      content: `Done! Here’s what I found for: ${task}\n\nI researched this end-to-end and distilled the key points. Full reasoning trail is in my session.\n\n— ${name} (telegram agent)`,
      task, tokens: { input: 500, output: 800 },
    }), t + 2200);
    setTimeout(() => ev('idle', name, { text: idle[i % idle.length], task }), t + 5000);
  };

  CLIENT_DEMO_NAMES.forEach((name, idx) => setTimeout(() => spawn(name), 400 + idx * 3500));
  // keep the office busy: new waves of tasks forever (continuous workflow).
  // Demo roster is capped at the cast size so desks never double-book.
  const cap = () => (window.__activeTheme && window.__activeTheme.agentNames
    ? window.__activeTheme.agentNames.length : CLIENT_DEMO_NAMES.length);
  let wave = 0;
  const loop = setInterval(() => {
    const names = (window.__activeTheme && window.__activeTheme.agentNames) || CLIENT_DEMO_NAMES;
    const name = names[wave % names.length];
    wave += 1;
    spawn(name);
    if (wave > 40) clearInterval(loop);
  }, 22000);
  onStatus('demo · in-browser');
  return cap;
}
