/* global fetch */
import { getParameter } from '../parameter-store/parameter-store.js'
import { ASANA_PARAMETER } from './globals.js'
import { prettyDate, getDueDate } from './helpers.js'
import { LOGGER } from '../index.js'

export async function createAsanaTask (UserName, ParameterName, assigneeId) {
  try {
    const asanaToken = await getParameter(UserName, ASANA_PARAMETER)
    const workspaceId = '551227202539'
    const dueDate = getDueDate()
    const prettyDueDate = prettyDate(dueDate)
    const taskName = `AWS IAM Key Rotation ${prettyDueDate}`
    const taskNotes = `Please rotate your IAM keys. 
    You have until ${prettyDueDate} to update your keys before your keys are deactivated.

    To gain access to your IAM keys please run:

    aws ssm get-parameter --region us-east-2 --name ${ParameterName} --with-decryption --query Parameter.Value --output text

    To verify success run:

    aws sts get-caller-identity
      
    If you have issues with the above command slack me.`

    const url = 'https://app.asana.com/api/1.0/tasks'

    LOGGER.addLog(UserName, 'CREATING', 'new Asana task')
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${asanaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          name: taskName,
          notes: taskNotes,
          workspace: workspaceId,
          assignee: String(assigneeId),
          due_on: dueDate
        }
      })
    })
    if (!res.ok) {
      throw new Error(`Could not create new Asana task: ${res.status} ${res.statusText}`)
    }

    const { data } = await res.json()
    LOGGER.addLog(UserName, 'CREATED', `new Asana task: ${data.permalink_url}`)
    return data
  } catch (error) {
    LOGGER.addLog(UserName, 'ERROR', error)
    return null
  }
}
