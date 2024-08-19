import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { region, account } from '../utilities/globals.js'
import { prettyDate } from '../utilities/helpers.js'

const TopicArn = `arn:aws:sns:${region}:${account}:notify-sre`

const snsClient = new SNSClient({ region })

export async function publishMessage (Message) {
  const currentDate = prettyDate(new Date())

  const Subject = `IAM Key Rotation Logs ${currentDate}`
  const params = {
    Message,
    Subject,
    TopicArn
  }

  try {
    const data = await snsClient.send(new PublishCommand(params))
    console.log('Message sent, ID:', data.MessageId)
  } catch (err) {
    console.error(err)
  }
}
