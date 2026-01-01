const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { httpMethod, path, body, pathParameters } = event;

  try {
    switch (`${httpMethod} ${path}`) {
      case 'GET /health':
        return response(200, { status: 'healthy', timestamp: new Date().toISOString() });
      
      case 'POST /api/documents':
        return await createDocument(JSON.parse(body));
      
      case 'GET /api/documents':
        return await listDocuments();
      
      default:
        if (httpMethod === 'GET' && path.startsWith('/api/documents/')) {
          const documentId = pathParameters.proxy;
          return await getDocument(documentId);
        }
        return response(404, { error: 'Not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

async function createDocument(data) {
  const documentId = uuidv4();
  const { name, content = '', language = 'javascript', userId } = data;
  
  const document = {
    documentId,
    name,
    content,
    language,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 0
  };

  await dynamodb.put({
    TableName: 'kriya-documents',
    Item: document
  }).promise();

  return response(201, document);
}

async function getDocument(documentId) {
  const result = await dynamodb.get({
    TableName: 'kriya-documents',
    Key: { documentId }
  }).promise();

  if (!result.Item) {
    return response(404, { error: 'Document not found' });
  }

  return response(200, result.Item);
}

async function listDocuments() {
  const result = await dynamodb.scan({
    TableName: 'kriya-documents'
  }).promise();

  return response(200, { documents: result.Items });
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}