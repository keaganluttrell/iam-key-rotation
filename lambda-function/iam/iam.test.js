import {
  listAccessKeys,
  createAccessKey,
  deactivateAccessKey,
  deleteAccessKey
} from './iam'
import {
  IAMClient,
  ListAccessKeysCommand,
  CreateAccessKeyCommand,
  UpdateAccessKeyCommand,
  DeleteAccessKeyCommand
} from '@aws-sdk/client-iam'
import { updateParameter } from '../parameter-store/parameter-store.js'
import { LOGGER } from '../index.js'
import { createAsanaTask } from '../utilities/createAsanaTask.js'

jest.mock('@aws-sdk/client-iam')
jest.mock('../parameter-store/parameter-store.js')
jest.mock('../utilities/createAsanaTask.js')

describe('Test listAccessKeys function', () => {
  afterEach(() => {
    IAMClient.mockClear()
    LOGGER.print()
    LOGGER.clearLogs()
  })

  it('should fetch access keys from IAM', async () => {
    const mockResponse = {
      AccessKeyMetadata: [
        { AccessKeyId: 'key1', Status: 'Active' },
        { AccessKeyId: 'key2', Status: 'Inactive' }
      ]
    }

    IAMClient.prototype.send.mockResolvedValueOnce(mockResponse)
    const result = await listAccessKeys('TestUser')

    expect(result).toEqual(mockResponse.AccessKeyMetadata)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(ListAccessKeysCommand))
    expect(IAMClient).toHaveBeenCalledWith({ region: 'us-east-2' })
    expect(IAMClient).toHaveBeenCalledTimes(1)
  })

  it('should handle errors when calling IAM', async () => {
    const mockError = new Error('Some IAM error')

    IAMClient.prototype.send.mockRejectedValueOnce(mockError)
    const result = await listAccessKeys('TestUser')

    expect(result).toBeNull()
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(ListAccessKeysCommand))
    expect(IAMClient).toHaveBeenCalledWith({ region: 'us-east-2' })
    expect(IAMClient).toHaveBeenCalledTimes(1)
  })
})

describe('createAccessKey', () => {
  afterEach(() => {
    IAMClient.mockClear()
    updateParameter.mockClear()
    LOGGER.clearLogs()
  })

  it('creates a new access key successfully', async () => {
    const mockResponse = {
      AccessKey: {
        AccessKeyId: 'mocked_access_key_id',
        SecretAccessKey: 'mocked_secret_access_key'
      }
    }
    IAMClient.prototype.send.mockResolvedValueOnce(mockResponse)
    updateParameter.mockResolvedValueOnce()

    const result = await createAccessKey('TestUser', 'TestParameter', 'TestAssignee')

    expect(IAMClient).toHaveBeenCalledTimes(1)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(CreateAccessKeyCommand))
    expect(updateParameter).toHaveBeenCalledWith('TestUser', 'TestParameter', JSON.stringify(mockResponse.AccessKey))
    expect(createAsanaTask).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('handles an error when creating an access key', async () => {
    const mockError = new Error('CreateAccessKey failed.')
    IAMClient.prototype.send.mockRejectedValueOnce(mockError)

    const result = await createAccessKey('TestUser', 'TestParameter', 'TestAssignee')

    expect(IAMClient).toHaveBeenCalledTimes(1)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(CreateAccessKeyCommand))
    expect(result).toBe(null)
  })
})

describe('deactivateAccessKey', () => {
  afterEach(() => {
    IAMClient.mockClear()
    LOGGER.print()
    LOGGER.clearLogs()
  })

  it('deactivates an access key', async () => {
    const mockResponse = {}
    IAMClient.prototype.send.mockResolvedValueOnce(mockResponse)

    await deactivateAccessKey('TestUser', 'TestAccessKeyId')

    expect(IAMClient).toHaveBeenCalledTimes(1)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(UpdateAccessKeyCommand))
  })

  it('handles an error when deactivating an access key', async () => {
    const mockError = new Error('Deactivate failed.')
    IAMClient.prototype.send.mockRejectedValueOnce(mockError)

    await deactivateAccessKey('TestUser', 'TestAccessKeyId')

    expect(IAMClient).toHaveBeenCalledTimes(1)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(UpdateAccessKeyCommand))
  })
})

describe('deleteAccessKey', () => {
  afterEach(() => {
    IAMClient.mockClear()
    LOGGER.print()
    LOGGER.clearLogs()
  })

  it('deletes an access key', async () => {
    const mockResponse = {}
    IAMClient.prototype.send.mockResolvedValueOnce(mockResponse)

    await deleteAccessKey('TestUser', 'TestAccessKeyId')

    expect(IAMClient).toHaveBeenCalledTimes(1)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(DeleteAccessKeyCommand))
  })

  it('handles an error when deleting an access key', async () => {
    const mockError = new Error('Delete failed.')
    IAMClient.prototype.send.mockRejectedValueOnce(mockError)

    await deleteAccessKey('TestUser', 'TestAccessKeyId')

    expect(IAMClient).toHaveBeenCalledTimes(1)
    expect(IAMClient.prototype.send).toHaveBeenCalledWith(expect.any(DeleteAccessKeyCommand))
  })
})
