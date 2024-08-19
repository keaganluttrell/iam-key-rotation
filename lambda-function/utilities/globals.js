export const account = process.env.CDK_DEFAULT_ACCOUNT
export const region = process.env.CDK_DEFAULT_ACCOUNT
export const MAX_KEYS = 2
export const DELETE_AGE = 110
export const DEACTIVATE_AGE = 100
export const CREATE_AGE = 90
export const MS_IN_A_DAY = 1000 * 60 * 60 * 24
export const ASANA_PARAMETER = '/data/credentials/asana_api_key'

export const HUMAN_USERS = {
  brent: {
    userName: 'user1',
    email: 'user1@domain.com',
    assigneeId: 'asana-assignee-id-1',
    parameterName: '/iam/user1/keys'
  },
  eric: {
    userName: 'user2',
    email: 'user2@domain.com',
    assigneeId: 'asana-assignee-id-2',
    parameterName: '/iam/user2/keys'
  },
  keagan: {
    userName: 'user3',
    email: 'usere@domain.com',
    assigneeId: 'asana-assignee-id-3',
    parameterName: '/iam/user3/keys'
  }
}
