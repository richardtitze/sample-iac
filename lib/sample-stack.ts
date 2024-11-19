import * as cdk from 'aws-cdk-lib';
import {Stack, StackProps} from 'aws-cdk-lib';
import {SampleEcsCluster} from "./sample-ecs-cluster";
import {SampleVpc} from "./sample-vpc";
import {SampleLoadBalancer} from "./sample-load-balancer";
import {SampleRdsPostgres} from "./sample-rds-postgres";
import {SampleBackendService} from "./sample-backend-service";
import {SampleEcrRepositories} from "./sample-ecr-repositories";
import {SampleDeploymentPolicy} from "./sample-deployment-policy";

export class SampleStack extends Stack {
    constructor(scope: cdk.App, id: string, props?: StackProps) {
        super(scope, id, props);

        const databaseName = 'sample';
        const databaseUsername = 'sample';
        const databasePassword = this.node.tryGetContext("databasePassword")
        const backendRepositoryName = this.node.tryGetContext('backendRepositoryName') || 'backend/sample';
        const backendImageTag = this.node.tryGetContext('backendImageTag') || 'latest';

        const desiredBackendInstances: number = parseInt(this.node.tryGetContext('desiredBackendInstances'));

        new SampleEcrRepositories(this, 'SampleEcrRepositories', {
            repositoryNames: [backendRepositoryName],
        })

        const vpc = new SampleVpc(this).vpc;

        // Create the ECS cluster
        const cluster = new SampleEcsCluster(this, {
            vpc
        }).cluster

        // Create the load balancer
        const loadBalancer = new SampleLoadBalancer(this, {
            vpc,
            cluster,
        })

        // Create the database
        const database = new SampleRdsPostgres(this, {
            vpc,
            databasePassword,
            databaseUsername,
            databaseName
        })

        const databaseHost = database.postgresRdsInstance.dbInstanceEndpointAddress

        // Create the backend service
        const backendService = new SampleBackendService(this, {
            vpc,
            cluster,
            loadBalancer,
            repositoryName: backendRepositoryName,
            imageTag: backendImageTag,
            databasePassword,
            databaseUsername,
            databaseHost,
            databaseName,
            desiredInstances: desiredBackendInstances
        })

        new SampleDeploymentPolicy(this, 'SampleDeploymentPolicy', {
            taskDefinitions: [backendService.taskDefinition],
            services: [backendService.ecsService],
        })
    }
}