import {z} from 'zod'
import { IProjectService } from './project.service';

export * from './project.service'; 


export const Services = z.object({
    project: IProjectService
}) 

export type Services = z.infer<typeof Services>