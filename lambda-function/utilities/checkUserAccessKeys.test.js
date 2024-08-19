import { checkUserAccessKeys } from './checkUserAccessKeys.js'
import { createAccessKey, deactivateAccessKey, deleteAccessKey, listAccessKeys } from '../iam/iam.js'
import { LOGGER } from '../index.js'
import { CREATE_AGE, DEACTIVATE_AGE, DELETE_AGE } from './globals.js'
import { getKeyAgeInDays, isValidHuman, needsNewKey } from './helpers.js'

jest.mock('../iam/iam.js')
jest.mock('./helpers.js')

describe('checkUserAccessKeys', () => {
  const mockUser = {
    userName: 'testUser',
    parameterName: 'testParameter',
    assigneeId: 'testAssignee'
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    LOGGER.print()
  })

  it('CREATE_AGE < DEACTIVATE_AGE < DELETE_AGE', () => {
    expect(CREATE_AGE).toBeLessThan(DEACTIVATE_AGE)
    expect(DEACTIVATE_AGE).toBeLessThan(DELETE_AGE)
  })

  it('should handle valid human user', async () => {
    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockResolvedValueOnce([])
    needsNewKey.mockResolvedValueOnce(false)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(listAccessKeys).toHaveBeenCalledWith(mockUser.userName)
    expect(needsNewKey).toHaveBeenCalledWith(mockUser.userName, expect.any(Date))
  })

  it('should handle invalid human user', async () => {
    isValidHuman.mockReturnValueOnce(false)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
  })

  it('should return null when listAccessKeys returns null', async () => {
    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(null)

    const result = await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(result).toBeNull()
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
    expect(createAccessKey).not.toHaveBeenCalled()
  })

  it('should create key when listAccessKeys returns empty array', async () => {
    const { userName, parameterName, assigneeId } = mockUser

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce([])
    needsNewKey.mockReturnValueOnce(true)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(createAccessKey).toHaveBeenCalledWith(userName, parameterName, assigneeId)
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should create key when listAccessKeys returns a single key greater than CREATE_AGE and less than DEACTIVATE/DELETE AGE', async () => {
    const { userName, parameterName, assigneeId } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays.mockReturnValueOnce(CREATE_AGE + 1)
    needsNewKey.mockReturnValueOnce(true)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).toHaveBeenCalledWith(userName, parameterName, assigneeId)
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should not create key when listAccessKeys returns a multiple keys and newest key >= CREATE_AGE', async () => {
    const { userName } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Active',
        CreateDate: 'some date'
      },
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays
      .mockReturnValueOnce(CREATE_AGE + 1)
      .mockReturnValueOnce(CREATE_AGE + 1)
    needsNewKey.mockReturnValueOnce(false)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).not.toHaveBeenCalled()
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should not create key when listAccessKeys returns a single key and a new key is not needed', async () => {
    const { userName } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays.mockReturnValueOnce(CREATE_AGE - 1)
    needsNewKey.mockReturnValueOnce(false)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).not.toHaveBeenCalled()
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should not deactivate key when listAccessKeys returns any key with Inactive Status and age >= DEACTIVATE_AGE', async () => {
    const { userName } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Inactive',
        CreateDate: 'some date'
      },
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Inactive',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays
      .mockReturnValueOnce(DEACTIVATE_AGE)
      .mockReturnValueOnce(DEACTIVATE_AGE + 1)
    needsNewKey.mockReturnValueOnce(false)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).not.toHaveBeenCalled()
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should not deactivate but should create key when listAccessKeys returns single key with age under DEACTIVATE AGE', async () => {
    const { userName, parameterName, assigneeId } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays.mockReturnValueOnce(DEACTIVATE_AGE - 1)
    needsNewKey.mockReturnValueOnce(true)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).toHaveBeenCalledWith(userName, parameterName, assigneeId)
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should deactivate and create key when listAccessKeys returns single key equal to DEACTIVATE_AGE', async () => {
    const { userName, parameterName, assigneeId } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxxx',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays.mockReturnValueOnce(DEACTIVATE_AGE)
    needsNewKey.mockReturnValueOnce(true)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).toHaveBeenCalledWith(userName, parameterName, assigneeId)
    expect(deactivateAccessKey).toHaveBeenCalledWith(userName, mockedKeys[0].AccessKeyId)
    expect(deleteAccessKey).not.toHaveBeenCalled()
  })

  it('should delete and create key when listAccessKeys returns keys >= DELETE_AGE', async () => {
    const { userName, parameterName, assigneeId } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxx1',
        Status: 'Active',
        CreateDate: 'some date'
      },
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxx2',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys.mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays
      .mockReturnValueOnce(DELETE_AGE)
      .mockReturnValueOnce(DELETE_AGE + 1)
    needsNewKey.mockReturnValueOnce(true)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).toHaveBeenCalledWith(userName, parameterName, assigneeId)
    expect(deactivateAccessKey).not.toHaveBeenCalled()
    expect(deleteAccessKey).toHaveBeenCalledWith(userName, mockedKeys[0].AccessKeyId)
    expect(deleteAccessKey).toHaveBeenCalledWith(userName, mockedKeys[1].AccessKeyId)
  })

  it('should delete, deactivate, and create key', async () => {
    const { userName, parameterName, assigneeId } = mockUser
    const mockedKeys = [
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxx1',
        Status: 'Active',
        CreateDate: 'some date'
      },
      {
        UserName: userName,
        AccessKeyId: 'xxxxxxxxxxxxxxxxxxx2',
        Status: 'Active',
        CreateDate: 'some date'
      }
    ]

    isValidHuman.mockReturnValueOnce(true)
    listAccessKeys
      .mockReturnValueOnce(mockedKeys)
    getKeyAgeInDays
      .mockReturnValueOnce(DEACTIVATE_AGE)
      .mockReturnValueOnce(DELETE_AGE)
    needsNewKey.mockReturnValueOnce(true)

    await checkUserAccessKeys(mockUser)

    expect(isValidHuman).toHaveBeenCalledWith(mockUser)
    expect(getKeyAgeInDays).toHaveBeenCalledTimes(mockedKeys.length)
    expect(createAccessKey).toHaveBeenCalledWith(userName, parameterName, assigneeId)
    expect(deactivateAccessKey).toHaveBeenCalledWith(userName, mockedKeys[0].AccessKeyId)
    expect(deleteAccessKey).toHaveBeenCalledWith(userName, mockedKeys[1].AccessKeyId)
  })
})
