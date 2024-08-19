import Logger from './utilities/logger.js'
import { HUMAN_USERS } from './utilities/globals.js'
import { checkUserAccessKeys } from './utilities/checkUserAccessKeys.js'
import { publishMessage } from './sns/sns.js'

export const LOGGER = new Logger()

export async function handler () {
  for (const userName in HUMAN_USERS) {
    const user = HUMAN_USERS[userName]

    await checkUserAccessKeys(user)
  }

  await publishMessage(LOGGER.getLogs().join('\n'))
  LOGGER.print()
  LOGGER.clearLogs()
};
