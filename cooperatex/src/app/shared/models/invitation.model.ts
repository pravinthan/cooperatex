import { User } from "./user.model";

export class Invitation {
  from: User;
  to: User;
  projectId: string;
  projectTitle: string;
}
