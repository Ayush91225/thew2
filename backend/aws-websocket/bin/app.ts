#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KriyaWebSocketStack } from '../lib/kriya-websocket-stack';

const app = new cdk.App();
new KriyaWebSocketStack(app, 'KriyaWebSocketStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1',
  },
});