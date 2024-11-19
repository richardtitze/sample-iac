import * as iam from 'aws-cdk-lib/aws-iam';
import {Construct} from 'constructs';
import {IService, ITaskDefinition} from "aws-cdk-lib/aws-ecs";

interface DeploymentPolicyProps {
    taskDefinitions: ITaskDefinition[];
    services: IService[];
}

export class SampleDeploymentPolicy extends Construct {
    constructor(scope: Construct, id: string, props: DeploymentPolicyProps) {
        super(scope, id);

        // Create the IAM policy
        const deploymentPolicy = new iam.ManagedPolicy(this, 'DeploymentPolicy', {
            managedPolicyName: 'ECSDeploymentPolicy',
            description: 'Policy for ECS task definition registration and service deployment',
            statements: [
                // RegisterTaskDefinition
                new iam.PolicyStatement({
                    sid: 'RegisterTaskDefinition',
                    effect: iam.Effect.ALLOW,
                    actions: ['ecs:RegisterTaskDefinition'],
                    resources: props.taskDefinitions.map(td => td.taskDefinitionArn),
                }),

                // DescribeTaskDefinition
                new iam.PolicyStatement({
                    sid: 'DescribeTaskDefinition',
                    effect: iam.Effect.ALLOW,
                    actions: ['ecs:DescribeTaskDefinition'],
                    resources: props.taskDefinitions.map(td => td.taskDefinitionArn),
                }),

                // PassRolesInTaskDefinition
                new iam.PolicyStatement({
                    sid: 'PassRolesInTaskDefinition',
                    effect: iam.Effect.ALLOW,
                    actions: ['iam:PassRole'],
                    resources: props.taskDefinitions.flatMap(td => [td.taskRole.roleArn, td.executionRole!.roleArn]),
                }),

                // DeployService
                new iam.PolicyStatement({
                    sid: 'DeployService',
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'ecs:UpdateService',
                        'ecs:DescribeServices',
                    ],
                    resources: props.services.map(svc => svc.serviceArn),
                }),
            ],
        });
    }
}