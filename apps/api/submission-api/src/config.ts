import {z} from "zod"
import { MongoConfig } from "./infrastructure/mongo-config";
import DefaultConf from "../configurations/server.config.local";

export const SystemsConfig = z.object({
    mongo: MongoConfig
})

export type SystemsConfig = z.infer<typeof SystemsConfig>


export const ServerConfig = z.object({
    server: z.object({
        port: z.number()
    }),

    infrastructure: SystemsConfig
});

export type ServerConfig = z.infer<typeof ServerConfig>



export function createServerConfiguration(): ServerConfig {
    const conf = DefaultConf;

    conf.infrastructure.mongo.url = process.env.MONGO_URL || conf.infrastructure.mongo.url;
    conf.infrastructure.mongo.database_name = process.env.MONGO_DATABASE_NAME || conf.infrastructure.mongo.database_name;
    conf.server.port = process.env.SERVER_PORT ? Number.parseInt(process.env.SERVER_PORT) : conf.server.port;

    // We can customize the way we create configuration by using config files or dotenv
    return {
        server: {
            port: 3333,
        },
        infrastructure: {
            mongo: {
                url: "mongodb://localhost:27017/",
                database_name: "agir"
            }
        }
    };
}
