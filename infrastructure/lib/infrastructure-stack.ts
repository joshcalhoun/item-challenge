import * as cdk from 'aws-cdk-lib/core';
import * as path from 'path';
import { Construct } from 'constructs';
import { Table, AttributeType, BillingMode, ProjectionType} from 'aws-cdk-lib/aws-dynamodb';
import { FunctionProps, Runtime, Function, Code } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LambdaIntegration, RestApi, Cors } from 'aws-cdk-lib/aws-apigateway';


export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Single Table design with PK and SK
    const table = new Table(this, 'ItemsTable', {
      tableName: 'ExamItems',
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying by subject + status
    table.addGlobalSecondaryIndex({
      indexName: 'SubjectStatusIndex',
      partitionKey: { name: 'subject', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      projectionType:   ProjectionType.ALL,
    });

    // GSI for listing all CURRENT items without a table scan
    table.addGlobalSecondaryIndex({
      indexName: 'EntityTypeIndex',
      partitionKey: { name: 'SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    const codePath = path.join(__dirname, '../../dist');

    const defaultEnv = {
      USE_DYNAMODB: 'true',
      DYNAMODB_TABLE_NAME: table.tableName,
      LOG_LEVEL: 'info',
    };

    const defaultProps: Omit<FunctionProps, 'handler'> = {
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset(codePath),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: defaultEnv,
      logRetention: RetentionDays.TWO_WEEKS,
    };

    // Read-only lambdas
    const getItemFn = new Function(this, 'GetItemHandler', {
      ...defaultProps,
      handler: 'lambdas/getItem.handler',
    });

    const listItemsFn = new Function(this, 'ListItemsHandler', {
      ...defaultProps,
      handler: 'lambdas/listItems.handler',
    });

    const getAuditTrailFn = new Function(this, 'GetAuditTrailHandler', {
      ...defaultProps,
      handler: 'lambdas/getAuditTrail.handler',
    });

    table.grantReadData(getItemFn);
    table.grantReadData(listItemsFn);
    table.grantReadData(getAuditTrailFn);


    // Write lambdas
    const createItemFn = new Function(this, 'CreateItemHandler', {
      ...defaultProps,
      handler: 'lambdas/createItem.handler',
    });

    table.grantWriteData(createItemFn);

    // Read+write lambdas
    const updateItemFn = new Function(this, 'UpdateItemHandler', {
      ...defaultProps,
      handler: 'lambdas/updateItem.handler',
    });

    const createVersionFn = new Function(this, 'CreateVersionHandler', {
      ...defaultProps,
      handler: 'lambdas/createVersion.handler',
    });

    table.grantReadWriteData(updateItemFn);
    table.grantReadWriteData(createVersionFn);

    // API Gateway
    const api = new RestApi(this, 'ItemApi', {
      restApiName: 'Item Management API',
      deployOptions: {
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const items = api.root.addResource('api').addResource('items');
    items.addMethod('GET', new LambdaIntegration(listItemsFn));
    items.addMethod('POST', new LambdaIntegration(createItemFn));

    const item = items.addResource('{id}');
    item.addMethod('GET', new LambdaIntegration(getItemFn));
    item.addMethod('PUT', new LambdaIntegration(updateItemFn));

    const versions = item.addResource('versions');
    versions.addMethod('POST', new LambdaIntegration(createVersionFn));

    const audit = item.addResource('audit');
    audit.addMethod('GET', new LambdaIntegration(getAuditTrailFn));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
