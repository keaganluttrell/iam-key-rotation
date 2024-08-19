import { createAsanaTask } from './createAsanaTask.js'
import { getParameter } from '../parameter-store/parameter-store.js'
import { ASANA_PARAMETER } from './globals.js'
import { LOGGER } from '../index.js'

jest.mock('../parameter-store/parameter-store.js')

describe('createAsanaTask', () => {
  let fetchMock

  beforeEach(() => {
    getParameter.mockClear()
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() => {})
  })

  afterEach(() => {
    fetchMock.mockRestore()
    LOGGER.print()
    LOGGER.clearLogs()
  })

  it('creates an Asana task successfully', async () => {
    getParameter.mockResolvedValueOnce('mocked_token')
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: { permalink_url: 'http://mockurl.com' } })
    }
    fetchMock.mockResolvedValueOnce(mockResponse)

    const result = await createAsanaTask('UserName', 'ParameterName', 'assigneeId')

    expect(getParameter).toHaveBeenCalledWith('UserName', ASANA_PARAMETER)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer mocked_token', 'Content-Type': 'application/json' }
      })
    )
    expect(result.permalink_url).toEqual('http://mockurl.com')
  })

  it('throws an error when fetching fails', async () => {
    getParameter.mockResolvedValueOnce('mocked_token')
    const mockResponse = { ok: false, status: 500, statusText: 'Internal Server Error' }
    fetchMock.mockResolvedValueOnce(mockResponse)

    const response = await createAsanaTask('UserName', 'ParameterName', 'assigneeId')

    expect(response).toBeNull()
  })

  it('throws an error when getParameter fails', async () => {
    getParameter.mockRejectedValueOnce(new Error('getParameter failed'))

    const response = await createAsanaTask('UserName', 'ParameterName', 'assigneeId')
    expect(response).toBeNull()
  })
})
