import { User } from "./user.model";

export class Project {
  _id: string;
  owner: User;
  title: string;
  collaborators: User[];
  files: any[];
  dateCreated: Date;
  lastUpdated: Date;
  lastUpdatedBy: User;
}
