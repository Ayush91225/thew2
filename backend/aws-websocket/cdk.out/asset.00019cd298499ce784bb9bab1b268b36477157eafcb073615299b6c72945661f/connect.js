const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.token || event.requestContext.identity.sourceIp;
  
  console.log('Connect:', { connectionId, userId });
  
  try {
    await dynamodb.put({
      TableName: process.env.CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        connectedAt: Date.now(),
      },
    }).promise();
    
    return { statusCode: 200 };
  } catch (error) {
    console.error('Connect error:', error);
    return { statusCode: 500 };
  }
};