import {
  IAMClient,
  ListAccessKeysCommand,
  CreateAccessKeyCommand,
  UpdateAccessKeyCommand,
  DeleteAccessKeyCommand
} from '@aws-sdk/client-iam'
import { LOGGER } from '../index.js'
import { region } from '../utilities/globals.js'
import { updateParameter } from '../parameter-store/parameter-store.js'
import { createAsanaTask } from '../utilities/createAsanaTask.js'

export async function listAccessKeys (UserName) {
  const iam = new IAMClient({ region })
  try {
    const cmd = new ListAccessKeysCommand({ UserName })
    const accessKeys = await iam.send(cmd)
    LOGGER.addLog(UserName, 'LIST', 'Listed access keys')
    return accessKeys.AccessKeyMetadata
  } catch (error) {
    LOGGER.addLog(UserName, 'Error', `Could not list access keys: ${error}`)
    return null
  }
}

export async function createAccessKey (UserName, ParameterName, assigneeId) {
  const iam = new IAMClient({ region })
  try {
    const cmd = new CreateAccessKeyCommand({ UserName })
    LOGGER.addLog(UserName, 'CREATING', 'new access key')
    const { AccessKey } = await iam.send(cmd)
    const { AccessKeyId, SecretAccessKey } = AccessKey
    LOGGER.addLog(UserName, 'CREATED', `key: ${AccessKeyId}`)
    await updateParameter(UserName, ParameterName, JSON.stringify({ AccessKeyId, SecretAccessKey }))
    await createAsanaTask(UserName, ParameterName, assigneeId)
    return true
  } catch (error) {
    LOGGER.addLog(UserName, 'ERROR', `Could not create key: ${error}`)
    return null
  }
}

export async function deactivateAccessKey (UserName, AccessKeyId) {
  const iam = new IAMClient({ region })
  try {
    const cmd = new UpdateAccessKeyCommand({
      UserName,
      AccessKeyId,
      Status: 'Inactive'
    })
    LOGGER.addLog(UserName, 'DEACTIVATING', `key: ${AccessKeyId}`)
    await iam.send(cmd)
    LOGGER.addLog(UserName, 'DEACTIVATED', `key: ${AccessKeyId}`)
  } catch (error) {
    LOGGER.addLog(UserName, 'ERROR', `Could not deactivate key ${AccessKeyId}: ${error}`)
    return null
  }
}

export async function deleteAccessKey (UserName, AccessKeyId) {
  const iam = new IAMClient({ region })
  try {
    const cmd = new DeleteAccessKeyCommand({
      UserName,
      AccessKeyId
    })
    LOGGER.addLog(UserName, 'DELETING', `key: ${AccessKeyId}`)
    await iam.send(cmd)
    LOGGER.addLog(UserName, 'DELETED', `key: ${AccessKeyId}`)
  } catch (error) {
    LOGGER.addLog(UserName, 'ERROR', `Could not delete key: ${error}`)
    return null
  }
}
