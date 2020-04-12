import { User } from "./user.model";

export class Collaborator {
  pendingInvitation: boolean;
  acceptedInvitation: boolean;
  access: "read" | "readWrite";
  user: User;
}
