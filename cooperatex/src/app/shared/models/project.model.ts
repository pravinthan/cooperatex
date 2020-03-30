import { User } from "./user.model";
import { Collaborator } from "./collaborator.model";
import { MulterFile } from "./multer-file.model";

export class Project {
  _id: string;
  owner: User;
  title: string;
  collaborators: Collaborator[];
  files: MulterFile[];
  dateCreated: Date;
  lastUpdated: Date;
  lastUpdatedBy: User;
}
