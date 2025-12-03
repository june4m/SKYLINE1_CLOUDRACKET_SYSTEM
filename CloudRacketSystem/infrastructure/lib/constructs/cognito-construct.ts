import { Construct } from 'constructs';
import {
  UserPool,
  UserPoolClient,
  AccountRecovery,
  StringAttribute,
  OAuthScope,
  CfnUserPoolGroup,
} from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';

export interface CognitoConstructProps {
  stage: string;
  sesEmailArn?: string; // Optional, for custom email sender
}

export class CognitoConstruct extends Construct {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly userPoolId: string;
  public readonly userPoolArn: string;
  public readonly userPoolClientId: string;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    const { stage } = props;

    // Create User Pool with email as username and proper security settings
    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${stage}-cloud-racket-users`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: true,
          mutable: true,
        },
        phoneNumber: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        role: new StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }), // Values: 'user', 'court_owner', 'admin'
      },
      removalPolicy: RemovalPolicy.RETAIN, // Always retain user data
    });


    // Create User Pool Groups
    // Users Group - Regular users who book courts
    new CfnUserPoolGroup(this, 'UsersGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Users',
      description: 'Regular users who book courts',
      precedence: 3,
    });

    // Court Owners Group - Court owners who manage courts
    new CfnUserPoolGroup(this, 'CourtOwnersGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'CourtOwners',
      description: 'Court owners who manage courts',
      precedence: 2,
    });

    // Admins Group - Platform administrators
    new CfnUserPoolGroup(this, 'AdminsGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Admins',
      description: 'Platform administrators',
      precedence: 1,
    });

    // Create App Client with OAuth 2.0 flows
    this.userPoolClient = this.userPool.addClient('AppClient', {
      userPoolClientName: `${stage}-cloud-racket-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
        adminUserPassword: false,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/callback',
          `https://${stage}.cloudracket.com/callback`,
        ],
        logoutUrls: [
          'http://localhost:3000',
          `https://${stage}.cloudracket.com`,
        ],
      },
      accessTokenValidity: Duration.hours(24),
      idTokenValidity: Duration.hours(24),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Export User Pool ID, ARN, and App Client ID
    this.userPoolId = this.userPool.userPoolId;
    this.userPoolArn = this.userPool.userPoolArn;
    this.userPoolClientId = this.userPoolClient.userPoolClientId;
  }
}
