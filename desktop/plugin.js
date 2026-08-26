/* Hermes Agent Office — Hermes Desktop plugin (live office pane).
 *
 * Install: copy this file to <hermes home>/desktop-plugins/hermes-office/
 * (folder name must match the id), run the office server
 * (`python3 -m office.server --demo` or `--db ~/.hermes/state.db`), then
 * choose "Reload desktop plugins" from the command palette.
 *
 * Plain ESM — UI is jsx() calls, not JSX syntax; only @hermes/plugin-sdk and
 * react resolve.
 */
import { jsx } from 'react/jsx-runtime'

const ID = 'hermes-office'
const OFFICE_URL = 'http://127.0.0.1:8741'

function OfficePane() {
  return jsx('iframe', {
    src: OFFICE_URL,
    className: 'h-full w-full border-0',
    style: { background: 'transparent' },
    title: 'Hermes Agent Office',
  })
}

export default {
  id: ID,
  name: 'Hermes Agent Office',
  description: 'Watch your Hermes agents work in a live virtual office.',
  register(ctx) {
    ctx.register({
      id: ID + '-pane',
      area: 'panes',
      title: 'Hermes Office',
      data: { placement: 'right', width: 520 },
      render: OfficePane,
    })
  },
}
