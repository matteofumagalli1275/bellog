import {ProfileRepositoryInterface} from "./ProfileRepositoryInterface";
import {ProfileIndexedDbRepository} from "./ProfileIndexedDbRepository";


export class ProfileRepositoryFactory {
    static getRepository(): ProfileRepositoryInterface {
        return new ProfileIndexedDbRepository()
    }
}