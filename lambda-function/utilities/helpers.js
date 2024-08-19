import { MS_IN_A_DAY, CREATE_AGE, MAX_KEYS } from './globals.js'
import { listAccessKeys } from '../iam/iam.js'
import { LOGGER } from '../index.js'

export function isValidHuman (human) {
  return typeof human === 'object' &&
    typeof human.userName === 'string' &&
    typeof human.email === 'string' &&
    typeof human.assigneeId === 'string' &&
    typeof human.parameterName === 'string'
}

export function getKeyAgeInDays (currentDate, creationDate) {
  const diffTime = Math.abs(currentDate - creationDate)
  return Math.ceil(diffTime / MS_IN_A_DAY)
}

export async function needsNewKey (userName, currentDate) {
  const accessKeys = await listAccessKeys(userName)
  if (accessKeys === null) {
    LOGGER.addLog(userName, 'ERROR', 'could not list keys for function needsNewKeyResult')
    return false
  }
  if (accessKeys.length === 0) {
    return true
  }
  if (accessKeys.length >= MAX_KEYS) {
    LOGGER.addLog(userName, 'INFO', `${accessKeys.length} keys meets max allowed. keys: ${accessKeys.map(k => k.AccessKeyId).join(', ')}`)
    return false
  }

  accessKeys.sort((a, b) => b.CreateDate - a.CreateDate)
  const newestKey = accessKeys[0]
  const newestKeyAge = getKeyAgeInDays(currentDate, new Date(newestKey.CreateDate))
  return newestKeyAge >= CREATE_AGE
}

export function getDueDate () {
  const today = new Date()
  const daysLater = 10
  return new Date(today.getTime() + (daysLater * MS_IN_A_DAY))
}

export function prettyDate (date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

function padding (string, padding, char = ' ') {
  while (string.length < padding) {
    if (string.length % 2) {
      string = char + string
    } else {
      string += char
    }
  }
  return string
}

function rightPadding (msg, padding) {
  while (msg.length < padding) {
    msg += ' '
  }
  return msg
}

export function logStart () {
  return `|${padding('', 10, '-')}+${padding('', 14, '-')}+${'-'.repeat(40)}+
|${padding('USER', 10, ' ')}|${padding('ACTION', 14, ' ')}|${padding('MESSAGE', 40)}|`
}

export function logMsg (action, user, msg) {
  return `|${padding('', 10, '-')}+${padding('', 14, '-')}+${'-'.repeat(40)}+
|${padding(user, 10)}|${padding(action, 14)}|${rightPadding(msg, 40)}|`
}

export function logEnd () {
  return `|${padding('', 10, '-')}+${padding('', 14, '-')}+${'-'.repeat(40)}+`
}
