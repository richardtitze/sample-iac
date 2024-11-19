import {Construct} from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import {IRepository, TagStatus} from 'aws-cdk-lib/aws-ecr';

export interface SampleEcrRepositoriesProps {
    repositoryNames: string[];
}

export class SampleEcrRepositories extends Construct {
    public readonly repositories: IRepository[];

    constructor(scope: Construct, id: string, props: SampleEcrRepositoriesProps) {
        super(scope, id);

        const repositoryNames = props?.repositoryNames || []
        this.repositories = repositoryNames.map(repositoryName => {
            return new ecr.Repository(this, repositoryName, {
                repositoryName,
                lifecycleRules: [
                    {
                        rulePriority: 1,
                        description: "Keep only the 5 most recent images",
                        tagStatus: TagStatus.ANY,
                        maxImageCount: 2
                    }
                ]
            });
        });
    }
}
