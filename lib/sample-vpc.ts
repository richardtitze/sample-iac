import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {Construct} from "constructs";

export class SampleVpc {
    public readonly vpc: ec2.IVpc;

    constructor(scope: Construct) {

        // VPC
        this.vpc = new ec2.Vpc(scope, 'dev-sample-vpc', {
            maxAzs: 2, // Use 2 Availability Zones for high availability
            natGateways: 0, // No NAT Gateways
            subnetConfiguration: [
                {
                    name: 'PublicSubnet',
                    subnetType: ec2.SubnetType.PUBLIC, // Only public subnets
                    cidrMask: 24,
                },
            ],
        });

    }
}
