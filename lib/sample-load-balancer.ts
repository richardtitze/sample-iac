import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {Construct} from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import {CfnOutput} from "aws-cdk-lib";

interface SampleLoadBalancerProps {
    vpc: ec2.IVpc;
    cluster: ecs.Cluster;
}

export class SampleLoadBalancer {
    public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    public readonly listener: elbv2.ApplicationListener;

    constructor(scope: Construct, props: SampleLoadBalancerProps) {
        // Create an Application Load Balancer
        this.loadBalancer = new elbv2.ApplicationLoadBalancer(scope, "SampleLoadBalancer", {
            vpc: props.vpc,
            internetFacing: true,
        });

        // Create an http listener for the load balancer
        this.listener = this.loadBalancer.addListener('HttpsListener', {
            port: 80,
            open: true, // Allow public access
        });

        // Add a default action (e.g., return HTTP 404 for unmatched requests)
        this.listener.addAction('DefaultAction', {
            action: elbv2.ListenerAction.fixedResponse(404, {
                contentType: 'text/plain',
                messageBody: 'Cannot route your request; no matching project found.',
            }),
        });

        new CfnOutput(scope, 'DNS', {
            value: this.loadBalancer.loadBalancerDnsName,
        })
    }
}