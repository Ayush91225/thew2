const AWS = require('aws-sdk');
const logger = require('../utils/logger');

class DynamoService {
  constructor() {
    this.dynamodb = null;
    this.docClient = null;
    this.tableName = 'kriya-documents';
  }

  async initialize() {
    // Configure AWS SDK
    AWS.config.update({
      region: process.env.AWS_REGION || 'ap-south-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    this.dynamodb = new AWS.DynamoDB();
    this.docClient = new AWS.DynamoDB.DocumentClient();

    // Create table if it doesn't exist
    await this.createTableIfNotExists();
  }

  async createTableIfNotExists() {
    try {
      await this.dynamodb.describeTable({ TableName: this.tableName }).promise();
      logger.info(`DynamoDB table ${this.tableName} already exists`);
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        logger.info(`Creating DynamoDB table ${this.tableName}`);
        
        const params = {
          TableName: this.tableName,
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'createdBy', AttributeType: 'S' },
            { AttributeName: 'lastModified', AttributeType: 'N' }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'CreatedByIndex',
              KeySchema: [
                { AttributeName: 'createdBy', KeyType: 'HASH' },
                { AttributeName: 'lastModified', KeyType: 'RANGE' }
              ],
              Projection: { ProjectionType: 'ALL' },
              BillingMode: 'PAY_PER_REQUEST'
            }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        };

        await this.dynamodb.createTable(params).promise();
        
        // Wait for table to be active
        await this.dynamodb.waitFor('tableExists', { TableName: this.tableName }).promise();
        logger.info(`DynamoDB table ${this.tableName} created successfully`);
      } else {
        throw error;
      }
    }
  }

  async createDocument(document) {
    const now = Date.now();
    const item = {
      id: document.id,
      name: document.name,
      content: document.content || '',
      language: document.language || 'javascript',
      version: 1,
      createdBy: document.createdBy,
      collaborators: [],
      isPublic: false,
      metadata: {
        size: Buffer.byteLength(document.content || '', 'utf8'),
        lines: (document.content || '').split('\n').length,
        characters: (document.content || '').length
      },
      createdAt: now,
      lastModified: now
    };

    const params = {
      TableName: this.tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)'
    };

    try {
      await this.docClient.put(params).promise();
      return item;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('Document already exists');
      }
      throw error;
    }
  }

  async getDocument(id) {
    const params = {
      TableName: this.tableName,
      Key: { id }
    };

    try {
      const result = await this.docClient.get(params).promise();
      return result.Item;
    } catch (error) {
      logger.error('Get document error:', error);
      throw error;
    }
  }

  async updateDocument(id, updates) {
    const now = Date.now();
    
    // Build update expression
    let updateExpression = 'SET lastModified = :lastModified';
    let expressionAttributeValues = {
      ':lastModified': now
    };

    if (updates.content !== undefined) {
      updateExpression += ', content = :content, version = version + :inc';
      expressionAttributeValues[':content'] = updates.content;
      expressionAttributeValues[':inc'] = 1;
      
      // Update metadata
      updateExpression += ', metadata.size = :size, metadata.lines = :lines, metadata.characters = :chars';
      expressionAttributeValues[':size'] = Buffer.byteLength(updates.content, 'utf8');
      expressionAttributeValues[':lines'] = updates.content.split('\n').length;
      expressionAttributeValues[':chars'] = updates.content.length;
    }

    if (updates.name) {
      updateExpression += ', name = :name';
      expressionAttributeValues[':name'] = updates.name;
    }

    if (updates.language) {
      updateExpression += ', language = :language';
      expressionAttributeValues[':language'] = updates.language;
    }

    const params = {
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      logger.error('Update document error:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    const params = {
      TableName: this.tableName,
      Key: { id }
    };

    try {
      await this.docClient.delete(params).promise();
      return true;
    } catch (error) {
      logger.error('Delete document error:', error);
      throw error;
    }
  }

  async listDocuments(createdBy, limit = 50) {
    const params = {
      TableName: this.tableName,
      IndexName: 'CreatedByIndex',
      KeyConditionExpression: 'createdBy = :createdBy',
      ExpressionAttributeValues: {
        ':createdBy': createdBy
      },
      ScanIndexForward: false, // Sort by lastModified descending
      Limit: limit
    };

    try {
      const result = await this.docClient.query(params).promise();
      return result.Items;
    } catch (error) {
      logger.error('List documents error:', error);
      throw error;
    }
  }

  async addCollaborator(documentId, userId, permissions = 'write') {
    const params = {
      TableName: this.tableName,
      Key: { id: documentId },
      UpdateExpression: 'SET collaborators = list_append(if_not_exists(collaborators, :empty_list), :collaborator)',
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':collaborator': [{
          userId,
          permissions,
          joinedAt: Date.now()
        }]
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      logger.error('Add collaborator error:', error);
      throw error;
    }
  }

  async removeCollaborator(documentId, userId) {
    // First get the document to find the collaborator index
    const doc = await this.getDocument(documentId);
    if (!doc || !doc.collaborators) return doc;

    const collaboratorIndex = doc.collaborators.findIndex(c => c.userId === userId);
    if (collaboratorIndex === -1) return doc;

    const params = {
      TableName: this.tableName,
      Key: { id: documentId },
      UpdateExpression: `REMOVE collaborators[${collaboratorIndex}]`,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.docClient.update(params).promise();
      return result.Attributes;
    } catch (error) {
      logger.error('Remove collaborator error:', error);
      throw error;
    }
  }
}

module.exports = new DynamoService();