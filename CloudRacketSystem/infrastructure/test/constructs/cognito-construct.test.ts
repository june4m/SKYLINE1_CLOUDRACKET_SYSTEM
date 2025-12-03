import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CognitoConstruct } from '../../lib/constructs/cognito-construct';

describe('CognitoConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    new CognitoConstruct(stack, 'TestCognito', {
      stage: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('User Pool Configuration', () => {
    test('creates a User Pool with correct name', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'test-cloud-racket-users',
      });
    });

    test('User Pool uses email as sign-in alias', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UsernameAttributes: ['email'],
      });
    });

    test('User Pool has email auto-verification enabled', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AutoVerifiedAttributes: ['email'],
      });
    });

    test('User Pool has self sign-up enabled', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AdminCreateUserConfig: {
          AllowAdminCreateUserOnly: false,
        },
      });
    });

    test('User Pool has email-only account recovery', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            { Name: 'verified_email', Priority: 1 },
          ],
        },
      });
    });
  });

  describe('Password Policy', () => {
    test('password requires minimum 8 characters', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: Match.objectLike({
            MinimumLength: 8,
          }),
        },
      });
    });

    test('password requires lowercase characters', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: Match.objectLike({
            RequireLowercase: true,
          }),
        },
      });
    });

    test('password requires uppercase characters', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: Match.objectLike({
            RequireUppercase: true,
          }),
        },
      });
    });

    test('password requires numbers', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: Match.objectLike({
            RequireNumbers: true,
          }),
        },
      });
    });

    test('password requires symbols', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: Match.objectLike({
            RequireSymbols: true,
          }),
        },
      });
    });
  });

  describe('User Pool Groups', () => {
    test('creates 3 User Pool Groups', () => {
      template.resourceCountIs('AWS::Cognito::UserPoolGroup', 3);
    });

    test('creates Users group with precedence 3', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'Users',
        Description: 'Regular users who book courts',
        Precedence: 3,
      });
    });

    test('creates CourtOwners group with precedence 2', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'CourtOwners',
        Description: 'Court owners who manage courts',
        Precedence: 2,
      });
    });

    test('creates Admins group with precedence 1', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolGroup', {
        GroupName: 'Admins',
        Description: 'Platform administrators',
        Precedence: 1,
      });
    });
  });

  describe('App Client Configuration', () => {
    test('creates a User Pool Client', () => {
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    });

    test('App Client has correct name', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ClientName: 'test-cloud-racket-client',
      });
    });

    test('App Client has USER_PASSWORD_AUTH enabled', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ExplicitAuthFlows: Match.arrayWith([
          'ALLOW_USER_PASSWORD_AUTH',
        ]),
      });
    });

    test('App Client has USER_SRP_AUTH enabled', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ExplicitAuthFlows: Match.arrayWith([
          'ALLOW_USER_SRP_AUTH',
        ]),
      });
    });

    test('App Client prevents user existence errors', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        PreventUserExistenceErrors: 'ENABLED',
      });
    });
  });
});
