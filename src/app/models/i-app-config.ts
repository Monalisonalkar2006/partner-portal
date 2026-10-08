export interface IAppConfig {
    env: {
        name: string;
    }
    apiServer: {
        baseEndPoint: string;
    };
    awss3: {
        accessKeyId: string;
        secretAccessKey: string;
        FOLDER:string;
        Bucket:string;
    };
}
