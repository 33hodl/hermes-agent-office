/* Hermes Agent Office — creator panel logic.
 * Loads the creator markup, populates franchises, builds custom themes,
 * requests AI backdrops from the server, saves/export/import.
 */
'use strict';

(function () {
  let ready = false;
  const init = () => {
    if (ready) return;
    ready = true;

    // load creator markup
    const root = document.getElementById('creator-root');
    const holder = document.createElement('div');
    holder.innerHTML = CREATOR_HTML;
    while (holder.firstChild) root.appendChild(holder.firstChild);

    const $c = (id) => document.getElementById(id);
    const sel = $c('creator-franchise');

    // populate franchise dropdown
    for (const key of Object.keys(FRANCHISES)) {
      const f = FRANCHISES[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${f.emoji} ${f.label}`;
      sel.appendChild(opt);
    }

    const franchise = () => FRANCHISES[sel.value] || FRANCHISES.office;

    // auto-fill fields when franchise changes
    sel.addEventListener('change', () => {
      const f = franchise();
      $c('creator-name').value = f.label + ' Office';
      $c('creator-names').value = f.names.join(', ');
      $c('creator-accent').value = f.palette.accent || '#d96f4a';
      $c('creator-floor').value = f.palette.floor[0] || '#e8dcc3';
      $c('creator-dark').value = 'auto';
    });
    // initial fill
    sel.dispatchEvent(new Event('change'));

    const status = (msg, isErr) => {
      const el = $c('creator-status');
      el.textContent = msg;
      el.className = 'creator-status' + (isErr ? ' err' : '');
    };

    // build
    $c('creator-build').addEventListener('click', async () => {
      const btn = $c('creator-build');
      btn.disabled = true;
      status('Building your office…');
      try {
        const f = franchise();
        const name = $c('creator-name').value.trim() || f.label + ' Office';
        const names = $c('creator-names').value.split(',').map(s => s.trim()).filter(Boolean);
        const accent = $c('creator-accent').value;
        const floor = $c('creator-floor').value;
        const dark = $c('creator-dark').value;
        const wantBackdrop = $c('creator-backdrop').checked;
        const trails = $c('creator-trails').checked;

        const opts = {
          franchise: f,
          name,
          emoji: f.emoji,
          agentNames: names.length ? names : f.names,
          palette: Object.assign({}, f.palette, { accent, floor: [floor, floor] }),
          fx: Object.assign({}, f.fx, {
            dark: dark === 'auto' ? isDarkColor(floor) : dark === '1',
            trails,
          }),
        };

        // painted backdrop (server generates via Nous Portal)
        if (wantBackdrop) {
          status('Painting your backdrop (this can take ~30s)…');
          try {
            const res = await fetch('/api/art', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: f.prompt }),
            });
            const data = await res.json();
            if (data.ok) opts.backdrop = data.url;
            else status('Backdrop failed: ' + (data.error || 'unknown') + ' — building with colors only.', true);
          } catch (e) {
            status('Backdrop error: ' + e.message + ' — building with colors only.', true);
          }
        }

        const theme = buildCustomTheme(opts);
        // register + apply
        applyCustomTheme(theme);
        status(`Done! “${name}” is live. Switch anytime from the theme bar.`);
        document.getElementById('creator-modal').classList.add('hidden');
      } catch (e) {
        status('Build error: ' + e.message, true);
      } finally {
        btn.disabled = false;
      }
    });

    // export
    $c('creator-export').addEventListener('click', () => {
      const theme = window.__activeCustomTheme;
      if (!theme) { status('Nothing to export yet — build an office first.', true); return; }
      const blob = new Blob([JSON.stringify(stripForExport(theme), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (theme.label || 'office').toLowerCase().replace(/\s+/g, '-') + '-office.json';
      a.click();
      URL.revokeObjectURL(a.href);
      status('Exported! Share the JSON with anyone.');
    });

    // import
    $c('creator-import').addEventListener('click', () => $c('creator-import-file').click());
    $c('creator-import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const theme = importTheme(data);
          applyCustomTheme(theme);
          status(`Imported “${theme.label || 'custom office'}” and made it live!`);
        } catch (err) {
          status('Import failed: ' + err.message, true);
        }
      };
      reader.readAsText(file);
    });

    // close resets
    document.querySelectorAll('#creator-modal [data-close]').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('creator-modal').classList.add('hidden');
      });
    });
  };

  /* ---------- helpers shared with app ---------- */

  function stripForExport(theme) {
    return {
      label: theme.label, brand: theme.brand, emoji: theme.brand,
      palette: {
        accent: theme.ui.accent,
        floor: [theme.floor.base, theme.floor.alt],
        grid: theme.floor.grid,
        wall: [theme.wall.back, theme.wall.side, theme.wall.base, theme.wall.frame],
        wood: theme.props.wood, woodDark: theme.props.woodDark, woodTop: theme.props.woodTop,
        monitor: theme.props.monitor, screen: theme.props.screen, chair: theme.props.chair,
        pot: theme.props.pot, plant: theme.props.plant,
        mail: theme.props.mail, mailDark: theme.props.mailDark, rug: theme.props.rugPink,
        book: theme.props.book,
      },
      stations: theme.stations,
      desks: theme.desks,
      plants: theme.plants,
      fx: theme.fx,
      agentNames: theme.agentNames,
      backdrop: theme.backdrop,
      renderer: theme.renderer,
      version: 1,
    };
  }

  function importTheme(data) {
    const f = { label: data.label || 'Custom', emoji: data.brand || '🏢', names: data.agentNames || [], palette: data.palette || {}, prompt: '' };
    return buildCustomTheme({
      franchise: f,
      name: data.label || 'Custom Office',
      emoji: f.emoji,
      agentNames: data.agentNames || [],
      palette: data.palette || {},
      stations: data.stations,
      desks: data.desks,
      plants: data.plants,
      fx: data.fx,
      backdrop: data.backdrop || null,
      renderer: data.renderer || 'office',
    });
  }

  function applyCustomTheme(theme) {
    // exposed to app.js via window
    if (window.__applyCustomTheme) window.__applyCustomTheme(theme);
    else console.warn('app.js not ready for custom theme');
  }

  window.__creatorReady = init;
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
