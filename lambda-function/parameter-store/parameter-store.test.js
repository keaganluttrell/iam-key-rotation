import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand
} from '@aws-sdk/client-ssm'
import { getParameter, updateParameter } from './parameter-store.js'

jest.mock('@aws-sdk/client-ssm')
jest.mock('../index.js')

describe('getParameter', () => {
  it('gets a parameter', async () => {
    SSMClient.prototype.send.mockResolvedValueOnce({
      Parameter: { Value: 'testValue' }
    })

    const value = await getParameter('TestUser', 'TestParameter')

    expect(SSMClient.prototype.send).toHaveBeenCalledWith(expect.any(GetParameterCommand))
    expect(value).toEqual('testValue')
  })

  it('handles an error when getting a parameter', async () => {
    const mockError = new Error('Get failed.')
    SSMClient.prototype.send.mockRejectedValueOnce(mockError)

    const value = await getParameter('TestUser', 'TestParameter')

    expect(SSMClient.prototype.send).toHaveBeenCalledWith(expect.any(GetParameterCommand))
    expect(value).toBeNull()
  })
})

describe('updateParameter', () => {
  it('updates a parameter', async () => {
    SSMClient.prototype.send.mockResolvedValueOnce({})

    const result = await updateParameter('TestUser', 'TestParameter', 'NewValue')

    expect(SSMClient.prototype.send).toHaveBeenCalledWith(expect.any(PutParameterCommand))
    expect(result).toEqual(true)
  })

  it('handles an error when updating a parameter', async () => {
    const mockError = new Error('Update failed.')
    SSMClient.prototype.send.mockRejectedValueOnce(mockError)

    const result = await updateParameter('TestUser', 'TestParameter', 'NewValue')

    expect(SSMClient.prototype.send).toHaveBeenCalledWith(expect.any(PutParameterCommand))
    expect(result).toBeNull()
  })
})
