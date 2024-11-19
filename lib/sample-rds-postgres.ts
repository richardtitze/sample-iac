import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy, SecretValue} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

interface SampleRdsPostgresProps {
    readonly vpc: ec2.IVpc;
    readonly databasePassword: string;
    readonly databaseUsername: string;
    readonly databaseName: string;
}

export class SampleRdsPostgres {
    public readonly postgresRdsInstance: rds.DatabaseInstance;

    constructor(scope: Construct, props: SampleRdsPostgresProps) {

        // Security group to allow access to the database
        const securityGroup = new ec2.SecurityGroup(scope, 'DBSecurityGroup', {
            vpc: props.vpc,
            securityGroupName: 'AllowPostgresAccess',
            description: 'Allow access to PostgreSQL from anywhere',
            allowAllOutbound: true
        });

        // Open the PostgreSQL port (5432) to the world (0.0.0.0/0)
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432), 'Allow PostgreSQL access from anywhere');

        // RDS Instance
        this.postgresRdsInstance = new rds.DatabaseInstance(scope, 'PostgresInstance', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_16_4 // Postgres version
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO), // Free tier instance type
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC, // Make the RDS publicly accessible
            },
            multiAz: false,
            allocatedStorage: 20, // Free-tier limit
            storageType: rds.StorageType.GP2,
            publiclyAccessible: true, // Allow access over the internet
            securityGroups: [securityGroup],
            deletionProtection: false, // Make sure you can delete it
            removalPolicy: RemovalPolicy.DESTROY, // Clean up on deletion
            databaseName: props.databaseName,
            credentials: rds.Credentials.fromPassword(props.databaseUsername, SecretValue.unsafePlainText(props.databasePassword)),
            backupRetention: cdk.Duration.days(0) // No backups (adjust as needed)
        });
    }
}
