import { needsNewKey } from './helpers.js'
import { listAccessKeys } from '../iam/iam.js'
import { CREATE_AGE } from './globals.js'
import { LOGGER } from '../index.js'

jest.mock('../iam/iam.js')

describe('needsNewKey', () => {
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    LOGGER.print()
    LOGGER.clearLogs()
  })

  it('returns false when listAccessKeys returns null', async () => {
    listAccessKeys.mockResolvedValueOnce(null)
    const result = await needsNewKey('testUser', new Date())

    expect(result).toBe(false)
  })

  it('returns false when listAccessKeys returns array with length >= MAX_KEYS', async () => {
    const mockedKeys = [{}, {}]
    listAccessKeys.mockResolvedValueOnce(mockedKeys)
    const result = await needsNewKey('testUser', new Date())

    expect(result).toBe(false)
  })

  it('returns true when no access keys exist', async () => {
    listAccessKeys.mockResolvedValueOnce([])

    const result = await needsNewKey('testUser', new Date())

    expect(result).toBe(true)
  })

  it('returns true when newest key age is equal to CREATE_AGE', async () => {
    const currentDate = new Date()
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - CREATE_AGE)

    listAccessKeys.mockResolvedValueOnce([{ CreateDate: pastDate }])
    const result = await needsNewKey('testUser', currentDate)

    expect(result).toBe(true)
  })

  it('returns true when newest key age is greater than CREATE_AGE', async () => {
    const currentDate = new Date()
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - (CREATE_AGE + 1))

    listAccessKeys.mockResolvedValueOnce([{ CreateDate: pastDate }])
    const result = await needsNewKey('testUser', currentDate)

    expect(result).toBe(true)
  })

  it('returns false when newest key age is less than CREATE_AGE', async () => {
    const currentDate = new Date()
    const pastDate = new Date()
    const pastDate2 = new Date()
    pastDate.setDate(currentDate.getDate() - (CREATE_AGE + 1))
    pastDate2.setDate(currentDate.getDate() - (CREATE_AGE - 1))

    listAccessKeys.mockResolvedValueOnce([{ CreateDate: pastDate }, { CreateDate: pastDate2 }])
    const result = await needsNewKey('testUser', currentDate)

    expect(result).toBe(false)
  })
})
