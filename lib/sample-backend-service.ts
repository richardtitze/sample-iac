import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import {EcsTarget} from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import {Construct} from "constructs";
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {ApplicationListener, ApplicationProtocol} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {SampleLoadBalancer} from "./sample-load-balancer";
import {CfnOutput} from "aws-cdk-lib";

interface SampleBackendServiceProps {
    readonly vpc: ec2.IVpc;
    readonly cluster: ecs.ICluster;
    readonly loadBalancer: SampleLoadBalancer;
    readonly repositoryName: string;
    readonly imageTag: string;
    readonly databasePassword: string;
    readonly databaseUsername: string;
    readonly databaseHost: string;
    readonly databaseName: string;
    readonly desiredInstances: number
}

const target = (listener: ApplicationListener, protocol: ApplicationProtocol): EcsTarget => {
    return {
        containerName: 'sample-backend-container',
        containerPort: 8080,
        newTargetGroupId: `sample-backend-${protocol}-tg`,
        listener: ecs.ListenerConfig.applicationListener(listener, {
            protocol: protocol,
            conditions: [
                elbv2.ListenerCondition.pathPatterns(['/api/*'])
            ],
            priority: 1,
            healthCheck: {
                path: '/api/q/health'
            }
        }),
    }
}

export class SampleBackendService {
    readonly taskDefinition: ecs.Ec2TaskDefinition;
    readonly ecsService: ecs.Ec2Service;

    constructor(scope: Construct, props: SampleBackendServiceProps) {

        // Lookup ECR repository by name
        const repository = ecr.Repository.fromRepositoryName(scope, 'sample-backend-repo', props.repositoryName);

        // Create an ECS task definition with EC2 launch type
        this.taskDefinition = new ecs.Ec2TaskDefinition(scope, 'sample-backend-taskdef');

        // Add a container to the task definition from the private ECR repository, listening on port 8080
        const container = this.taskDefinition.addContainer('sample-backend-container', {
            image: ecs.ContainerImage.fromEcrRepository(repository, props.imageTag),
            memoryLimitMiB: 256,
            environment: { // Add environment variables here
                'quarkus.datasource.jdbc.url': `jdbc:postgresql://${props.databaseHost}:5432/${props.databaseName}`,
                'quarkus.datasource.username': props.databaseUsername,
                'quarkus.datasource.password': props.databasePassword
            },
        });

        container.addPortMappings({
            containerPort: 8080, // The container listens on port 8080
        });

        // Create an Application Load Balanced ECS service
        this.ecsService = new ecs.Ec2Service(scope, 'sample-backend-service', {
            cluster: props.cluster, // Use the cluster from the Cluster stack
            taskDefinition: this.taskDefinition,
            desiredCount: props.desiredInstances, // Number of container instances
        });

        this.ecsService.registerLoadBalancerTargets(
            target(props.loadBalancer.listener, ApplicationProtocol.HTTP),
        );

        // Ensure that the security group allows traffic on the container port
        this.ecsService.connections.securityGroups[0].addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(8080),
            'Allow HTTP traffic on port 8080'
        );

        // Grant ECS service permission to pull the image from ECR
        repository.grantPull(this.ecsService.taskDefinition.executionRole!);

        new CfnOutput(scope, 'BACKEND_TASK_DEFINTION_ARN', {
            value: this.taskDefinition.taskDefinitionArn,
        })

        new CfnOutput(scope, 'BACKEND_SERVICE_NAME', {
            value: this.ecsService.serviceName
        })

    }
}
