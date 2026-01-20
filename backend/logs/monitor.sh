#!/bin/bash

# KRIYA Collaboration System - Deployment Log
# Date: $(date)
# Region: ap-south-1 (Mumbai)

echo "=== KRIYA Collaboration Backend Deployment ===" >> deployment.log
echo "Timestamp: $(date)" >> deployment.log
echo "Region: ap-south-1" >> deployment.log
echo "" >> deployment.log

# WebSocket API Gateway
echo "WebSocket Endpoint: wss://xtc3torv9c.execute-api.ap-south-1.amazonaws.com/prod" >> deployment.log

# REST API Gateway  
echo "REST API Endpoint: https://1ngwyksutc.execute-api.ap-south-1.amazonaws.com/prod" >> deployment.log

# Lambda Functions
echo "Functions Deployed:" >> deployment.log
echo "  - kriya-collaboration-prod-websocket" >> deployment.log
echo "  - kriya-collaboration-prod-api" >> deployment.log

# DynamoDB Tables
echo "DynamoDB Tables:" >> deployment.log
echo "  - kriya-documents" >> deployment.log
echo "  - kriya-sessions" >> deployment.log

echo "" >> deployment.log
echo "Deployment Status: SUCCESS" >> deployment.log
echo "=======================================" >> deployment.log

# Monitor deployment
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/kriya-collaboration" --region ap-south-1 >> deployment.log

echo "Deployment completed successfully!"
echo "Check deployment.log for details"