import { createAccessKey, deactivateAccessKey, deleteAccessKey, listAccessKeys } from '../iam/iam.js'
import { LOGGER } from '../index.js'
import { DEACTIVATE_AGE, DELETE_AGE } from './globals.js'
import { getKeyAgeInDays, isValidHuman, needsNewKey } from './helpers.js'

export async function checkUserAccessKeys (user) {
  const { userName, parameterName, assigneeId } = user

  if (!isValidHuman(user)) {
    LOGGER.addLog(userName, 'ERROR', 'invalid user')
    return null
  }

  const keys = await listAccessKeys(userName)
  if (keys === null) {
    return null
  }

  const currentDate = new Date()

  for (const key of keys) {
    const { AccessKeyId, CreateDate, Status } = key
    const age = getKeyAgeInDays(currentDate, CreateDate)

    LOGGER.addLog(userName, 'INFO', `key: ${AccessKeyId} age: ${age} days`)

    if (age >= DELETE_AGE) {
      await deleteAccessKey(userName, AccessKeyId)
    } else if (age >= DEACTIVATE_AGE && Status === 'Active') {
      await deactivateAccessKey(userName, AccessKeyId)
    }
  }

  const needsNewKeyResult = await needsNewKey(userName, currentDate)

  if (needsNewKeyResult) {
    await createAccessKey(userName, parameterName, assigneeId)
  }
}
