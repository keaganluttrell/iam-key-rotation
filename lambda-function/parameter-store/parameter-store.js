import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand
} from '@aws-sdk/client-ssm'
import { LOGGER } from '../index.js'

export async function getParameter (UserName, ParameterName) {
  const ssmClient = new SSMClient()
  try {
    const getParameterCommand = new GetParameterCommand({
      Name: ParameterName,
      WithDecryption: true
    })
    LOGGER.addLog(UserName, 'GETTING', `parameter: ${ParameterName}`)
    const data = await ssmClient.send(getParameterCommand)
    LOGGER.addLog(UserName, 'FOUND', `parameter: ${ParameterName}`)
    return data.Parameter.Value
  } catch (error) {
    LOGGER.addLog(UserName, 'ERROR', `Could not get parameter ${ParameterName}: ${error}`)
    return null
  }
}

export async function updateParameter (UserName, ParameterName, Value) {
  const ssmClient = new SSMClient()
  try {
    const parameterType = 'SecureString'

    const command = new PutParameterCommand({
      Name: ParameterName,
      Value,
      Type: parameterType,
      Overwrite: true
    })

    LOGGER.addLog(UserName, 'UPDATING', `parameter: ${ParameterName}`)
    await ssmClient.send(command)
    LOGGER.addLog(UserName, 'UPDATED', `parameter: ${ParameterName}`)
    return true
  } catch (error) {
    LOGGER.addLog(UserName, 'ERROR', `Could not update parameter ${ParameterName}: ${error}`)
    return null
  }
}
