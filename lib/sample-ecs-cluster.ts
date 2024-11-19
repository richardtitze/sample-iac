import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import {Construct} from "constructs";
import {CfnOutput} from "aws-cdk-lib";

interface SampleEcsClusterProps {
    readonly vpc: ec2.IVpc;
}

export class SampleEcsCluster {
    public readonly cluster: ecs.Cluster;

    constructor(scope: Construct, props: SampleEcsClusterProps) {

        // Create ECS cluster in the existing VPC
        this.cluster = new ecs.Cluster(scope, 'SampleEcsCluster', {
            vpc: props.vpc,
        });

        // Add EC2 capacity to the cluster (free tier t2.micro)
        this.cluster.addCapacity('DefaultAutoScalingGroup', {
            instanceType: new ec2.InstanceType('t2.micro'), // Free tier eligible instance
            vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC}, // Ensure EC2 instances are in public subnets
        });

        new CfnOutput(scope, 'ECS_CLUSTER_NAME', {
            value: this.cluster.clusterName,
            description: 'The name of the ECS cluster',
        })

    }
}
