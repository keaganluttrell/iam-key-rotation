# Abenity IAM Rotation Automation

## Purpose

The goal of this is to automate quarterly IAM key rotations with our users. Doing this by hand is estimated to take 2 - 4 hours. This automation is designed to automate as much of the process as possible.

## Function

CloudWatch Rule Invokes a Lambda that will iterate over the human users in Abenity AWS Account.  Based on the age of the key the function will determine whether to create, deactivate, or delete a given key.  On create, an Asana task is created giving the user an AWS command to access their new keys. When the function is invoked an output log will be sent to sre@abenity.com.

## Infrastructure as Code

The architecture is manage by AWS CloudFormatation by using AWS Cloud Deploy Kit (CDK).  I have create a [cdk](./cdk/) folder that contians all the deployment code to deploy and tear down this entire configuration from simple commands like `cdk deploy` or `cdk destroy` while in the [cdk](./cdk/) directory. The cdk code is written in Typescript, so a user must use `tsc` command before running a `cdk` command.


## References

- [Automate IAM Rotation](https://app.asana.com/0/0/1205079947453110/f)
- [CDK Docs](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
