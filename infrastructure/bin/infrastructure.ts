#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfrastructureStack, getEnvironmentConfig } from '../lib/infrastructure-stack';

const app = new cdk.App();

// Read stage from CDK context: `cdk deploy -c stage=prod`
const stage = app.node.tryGetContext('stage') || 'dev';
const envConfig = getEnvironmentConfig(stage);

new InfrastructureStack(app, `ItemChallenge-${envConfig.stage}`, {
  envConfig,
});
