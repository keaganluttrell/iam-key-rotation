import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import { resolve } from 'path';

const lambdaCodePath = resolve('../lambda-function');
const lambdaName = 'iam-key-rotation-lambda';
const stackName = 'IamRotationLambdaStack';

export class IamRotationLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const account = props?.env?.account;
    const region = props?.env?.region;

    const topicName = 'notify-sre'
    const topic = new Topic(this, topicName, {
      topicName: topicName,
      displayName: topicName,
    });

    topic.addSubscription(new EmailSubscription('sre@abenity.com'));

    const parameterStoreWritePolicy = new iam.PolicyStatement({
      actions: [
        'ssm:PutParameter',
      ],
      resources: [
        `arn:aws:ssm:${region}:${account}:parameter/iam/*`,
      ],
    });

    const parameterStoreReadPolicy = new iam.PolicyStatement({
      actions: [
        'ssm:GetParameter',
      ],
      resources: [
        `arn:aws:ssm:${region}:${account}:parameter/data/credentials/asana_sre`,
      ],
    });

    const iamReadWritePolicy = new iam.PolicyStatement({
      actions: [
        'iam:GetUser',
        'iam:ListUsers',
        'iam:CreateAccessKey',
        'iam:UpdateAccessKey',
        'iam:DeleteAccessKey',
        'iam:ListAccessKeys',
      ],
      resources: ['*'],
    });

    const lambdaRole = new iam.Role(this, `${lambdaName}-role`, {
      roleName: `${lambdaName}-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const snsWritePolicy = new iam.PolicyStatement({
      actions: [
        'sns:Publish'
      ],
      resources: [topic.topicArn],
    });

    lambdaRole.addToPolicy(parameterStoreReadPolicy);
    lambdaRole.addToPolicy(parameterStoreWritePolicy);
    lambdaRole.addToPolicy(iamReadWritePolicy);
    lambdaRole.addToPolicy(snsWritePolicy);

    const lambdaFn = new lambda.Function(this, lambdaName, {
      functionName: lambdaName,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromAsset(lambdaCodePath),
      memorySize: 256,
      timeout: cdk.Duration.seconds(60)
    });

    const rule = new events.Rule(this, `${lambdaName}-daily-rule`, {
      ruleName: `${lambdaName}-daily-rule`,
      schedule: events.Schedule.cron({ minute: '0', hour: '12' }),
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFn));
  }
}

const app = new cdk.App();
new IamRotationLambdaStack(app, stackName);
