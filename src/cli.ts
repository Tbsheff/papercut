import { Cli } from 'incur'

import { listCommand } from './commands/list.js'
import { logCommand } from './commands/log.js'
import { reopenCommand } from './commands/reopen.js'
import { resolveCommand } from './commands/resolve.js'
import { searchCommand } from './commands/search.js'
import { showCommand } from './commands/show.js'

export const cli = Cli.create('papercut', {
  description: 'Record and inspect development friction without changing a repository.',
  update: false,
  version: '0.1.0',
})
  .command('log', logCommand)
  .command('list', listCommand)
  .command('show', showCommand)
  .command('search', searchCommand)
  .command('resolve', resolveCommand)
  .command('reopen', reopenCommand)
