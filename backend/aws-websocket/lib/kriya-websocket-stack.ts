import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class KriyaWebSocketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'kriya-websocket-connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: 'kriya-documents-v2',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    documentsTable.addGlobalSecondaryIndex({
      indexName: 'CreatedByIndex',
      partitionKey: { name: 'createdBy', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastModified', type: dynamodb.AttributeType.NUMBER },
    });

    // Lambda Functions
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        DOCUMENTS_TABLE: documentsTable.tableName,
      },
    });

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        DOCUMENTS_TABLE: documentsTable.tableName,
      },
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'message.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        DOCUMENTS_TABLE: documentsTable.tableName,
      },
    });

    // Grant permissions
    connectionsTable.grantReadWriteData(connectHandler);
    connectionsTable.grantReadWriteData(disconnectHandler);
    connectionsTable.grantReadWriteData(messageHandler);
    documentsTable.grantReadWriteData(messageHandler);

    // WebSocket API
    const webSocketApi = new apigatewayv2.CfnApi(this, 'KriyaWebSocketApi', {
      name: 'kriya-collaboration-websocket',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    // Routes
    const connectRoute = new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$connect',
      target: `integrations/${new apigatewayv2.CfnIntegration(this, 'ConnectIntegration', {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${connectHandler.functionArn}/invocations`,
      }).ref}`,
    });

    const disconnectRoute = new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$disconnect',
      target: `integrations/${new apigatewayv2.CfnIntegration(this, 'DisconnectIntegration', {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${disconnectHandler.functionArn}/invocations`,
      }).ref}`,
    });

    const defaultRoute = new apigatewayv2.CfnRoute(this, 'DefaultRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$default',
      target: `integrations/${new apigatewayv2.CfnIntegration(this, 'MessageIntegration', {
        apiId: webSocketApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${messageHandler.functionArn}/invocations`,
      }).ref}`,
    });

    // WebSocket Stage
    const stage = new apigatewayv2.CfnStage(this, 'ProdStage', {
      apiId: webSocketApi.ref,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Lambda permissions
    connectHandler.addPermission('ApiGatewayInvokeConnect', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/*`,
    });

    disconnectHandler.addPermission('ApiGatewayInvokeDisconnect', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/*`,
    });

    messageHandler.addPermission('ApiGatewayInvokeMessage', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*/*`,
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: `wss://${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/prod`,
      description: 'WebSocket API URL',
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: documentsTable.tableName,
    });
  }
}