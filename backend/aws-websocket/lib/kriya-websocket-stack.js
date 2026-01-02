"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KriyaWebSocketStack = void 0;
const cdk = require("aws-cdk-lib");
const apigatewayv2 = require("aws-cdk-lib/aws-apigatewayv2");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const iam = require("aws-cdk-lib/aws-iam");
class KriyaWebSocketStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.KriyaWebSocketStack = KriyaWebSocketStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia3JpeWEtd2Vic29ja2V0LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia3JpeWEtd2Vic29ja2V0LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2REFBNkQ7QUFDN0QsaURBQWlEO0FBQ2pELHFEQUFxRDtBQUNyRCwyQ0FBMkM7QUFHM0MsTUFBYSxtQkFBb0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNoRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGtCQUFrQjtRQUNsQixNQUFNLGdCQUFnQixHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDcEUsU0FBUyxFQUFFLDZCQUE2QjtZQUN4QyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUMzRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNoRSxTQUFTLEVBQUUsb0JBQW9CO1lBQy9CLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFFSCxjQUFjLENBQUMsdUJBQXVCLENBQUM7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QUMsU0FBUztTQUNoQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6SUQsa0RBeUlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXl2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIEtyaXlhV2ViU29ja2V0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBEeW5hbW9EQiBUYWJsZXNcbiAgICBjb25zdCBjb25uZWN0aW9uc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDb25uZWN0aW9uc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAna3JpeWEtd2Vic29ja2V0LWNvbm5lY3Rpb25zJyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY29ubmVjdGlvbklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZG9jdW1lbnRzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0RvY3VtZW50c1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAna3JpeWEtZG9jdW1lbnRzLXYyJyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICBkb2N1bWVudHNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdDcmVhdGVkQnlJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NyZWF0ZWRCeScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdsYXN0TW9kaWZpZWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uc1xuICAgIGNvbnN0IGNvbm5lY3RIYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQ29ubmVjdEhhbmRsZXInLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdjb25uZWN0LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGEnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIENPTk5FQ1RJT05TX1RBQkxFOiBjb25uZWN0aW9uc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRE9DVU1FTlRTX1RBQkxFOiBkb2N1bWVudHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGlzY29ubmVjdEhhbmRsZXIgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdEaXNjb25uZWN0SGFuZGxlcicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2Rpc2Nvbm5lY3QuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYScpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQ09OTkVDVElPTlNfVEFCTEU6IGNvbm5lY3Rpb25zVGFibGUudGFibGVOYW1lLFxuICAgICAgICBET0NVTUVOVFNfVEFCTEU6IGRvY3VtZW50c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNzYWdlSGFuZGxlciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ01lc3NhZ2VIYW5kbGVyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnbWVzc2FnZS5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBDT05ORUNUSU9OU19UQUJMRTogY29ubmVjdGlvbnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERPQ1VNRU5UU19UQUJMRTogZG9jdW1lbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgY29ubmVjdGlvbnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY29ubmVjdEhhbmRsZXIpO1xuICAgIGNvbm5lY3Rpb25zVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGRpc2Nvbm5lY3RIYW5kbGVyKTtcbiAgICBjb25uZWN0aW9uc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShtZXNzYWdlSGFuZGxlcik7XG4gICAgZG9jdW1lbnRzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKG1lc3NhZ2VIYW5kbGVyKTtcblxuICAgIC8vIFdlYlNvY2tldCBBUElcbiAgICBjb25zdCB3ZWJTb2NrZXRBcGkgPSBuZXcgYXBpZ2F0ZXdheXYyLkNmbkFwaSh0aGlzLCAnS3JpeWFXZWJTb2NrZXRBcGknLCB7XG4gICAgICBuYW1lOiAna3JpeWEtY29sbGFib3JhdGlvbi13ZWJzb2NrZXQnLFxuICAgICAgcHJvdG9jb2xUeXBlOiAnV0VCU09DS0VUJyxcbiAgICAgIHJvdXRlU2VsZWN0aW9uRXhwcmVzc2lvbjogJyRyZXF1ZXN0LmJvZHkuYWN0aW9uJyxcbiAgICB9KTtcblxuICAgIC8vIFJvdXRlc1xuICAgIGNvbnN0IGNvbm5lY3RSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ0Nvbm5lY3RSb3V0ZScsIHtcbiAgICAgIGFwaUlkOiB3ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgcm91dGVLZXk6ICckY29ubmVjdCcsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtuZXcgYXBpZ2F0ZXdheXYyLkNmbkludGVncmF0aW9uKHRoaXMsICdDb25uZWN0SW50ZWdyYXRpb24nLCB7XG4gICAgICAgIGFwaUlkOiB3ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgICBpbnRlZ3JhdGlvblR5cGU6ICdBV1NfUFJPWFknLFxuICAgICAgICBpbnRlZ3JhdGlvblVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke2Nvbm5lY3RIYW5kbGVyLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgICB9KS5yZWZ9YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRpc2Nvbm5lY3RSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ0Rpc2Nvbm5lY3RSb3V0ZScsIHtcbiAgICAgIGFwaUlkOiB3ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgcm91dGVLZXk6ICckZGlzY29ubmVjdCcsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtuZXcgYXBpZ2F0ZXdheXYyLkNmbkludGVncmF0aW9uKHRoaXMsICdEaXNjb25uZWN0SW50ZWdyYXRpb24nLCB7XG4gICAgICAgIGFwaUlkOiB3ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgICBpbnRlZ3JhdGlvblR5cGU6ICdBV1NfUFJPWFknLFxuICAgICAgICBpbnRlZ3JhdGlvblVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke2Rpc2Nvbm5lY3RIYW5kbGVyLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgICB9KS5yZWZ9YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlZmF1bHRSb3V0ZSA9IG5ldyBhcGlnYXRld2F5djIuQ2ZuUm91dGUodGhpcywgJ0RlZmF1bHRSb3V0ZScsIHtcbiAgICAgIGFwaUlkOiB3ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgcm91dGVLZXk6ICckZGVmYXVsdCcsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtuZXcgYXBpZ2F0ZXdheXYyLkNmbkludGVncmF0aW9uKHRoaXMsICdNZXNzYWdlSW50ZWdyYXRpb24nLCB7XG4gICAgICAgIGFwaUlkOiB3ZWJTb2NrZXRBcGkucmVmLFxuICAgICAgICBpbnRlZ3JhdGlvblR5cGU6ICdBV1NfUFJPWFknLFxuICAgICAgICBpbnRlZ3JhdGlvblVyaTogYGFybjphd3M6YXBpZ2F0ZXdheToke3RoaXMucmVnaW9ufTpsYW1iZGE6cGF0aC8yMDE1LTAzLTMxL2Z1bmN0aW9ucy8ke21lc3NhZ2VIYW5kbGVyLmZ1bmN0aW9uQXJufS9pbnZvY2F0aW9uc2AsXG4gICAgICB9KS5yZWZ9YCxcbiAgICB9KTtcblxuICAgIC8vIFdlYlNvY2tldCBTdGFnZVxuICAgIGNvbnN0IHN0YWdlID0gbmV3IGFwaWdhdGV3YXl2Mi5DZm5TdGFnZSh0aGlzLCAnUHJvZFN0YWdlJywge1xuICAgICAgYXBpSWQ6IHdlYlNvY2tldEFwaS5yZWYsXG4gICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcbiAgICAgIGF1dG9EZXBsb3k6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgcGVybWlzc2lvbnNcbiAgICBjb25uZWN0SGFuZGxlci5hZGRQZXJtaXNzaW9uKCdBcGlHYXRld2F5SW52b2tlQ29ubmVjdCcsIHtcbiAgICAgIHByaW5jaXBhbDogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdhcGlnYXRld2F5LmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIHNvdXJjZUFybjogYGFybjphd3M6ZXhlY3V0ZS1hcGk6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OiR7d2ViU29ja2V0QXBpLnJlZn0vKi8qYCxcbiAgICB9KTtcblxuICAgIGRpc2Nvbm5lY3RIYW5kbGVyLmFkZFBlcm1pc3Npb24oJ0FwaUdhdGV3YXlJbnZva2VEaXNjb25uZWN0Jywge1xuICAgICAgcHJpbmNpcGFsOiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScpLFxuICAgICAgc291cmNlQXJuOiBgYXJuOmF3czpleGVjdXRlLWFwaToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06JHt3ZWJTb2NrZXRBcGkucmVmfS8qLypgLFxuICAgIH0pO1xuXG4gICAgbWVzc2FnZUhhbmRsZXIuYWRkUGVybWlzc2lvbignQXBpR2F0ZXdheUludm9rZU1lc3NhZ2UnLCB7XG4gICAgICBwcmluY2lwYWw6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYXBpZ2F0ZXdheS5hbWF6b25hd3MuY29tJyksXG4gICAgICBzb3VyY2VBcm46IGBhcm46YXdzOmV4ZWN1dGUtYXBpOiR7dGhpcy5yZWdpb259OiR7dGhpcy5hY2NvdW50fToke3dlYlNvY2tldEFwaS5yZWZ9LyovKmAsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYlNvY2tldFVSTCcsIHtcbiAgICAgIHZhbHVlOiBgd3NzOi8vJHt3ZWJTb2NrZXRBcGkucmVmfS5leGVjdXRlLWFwaS4ke3RoaXMucmVnaW9ufS5hbWF6b25hd3MuY29tL3Byb2RgLFxuICAgICAgZGVzY3JpcHRpb246ICdXZWJTb2NrZXQgQVBJIFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ29ubmVjdGlvbnNUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogY29ubmVjdGlvbnNUYWJsZS50YWJsZU5hbWUsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRG9jdW1lbnRzVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IGRvY3VtZW50c1RhYmxlLnRhYmxlTmFtZSxcbiAgICB9KTtcbiAgfVxufSJdfQ==