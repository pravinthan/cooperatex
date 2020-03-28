import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import * as io from "socket.io-client";
import { Invitation } from "./models/invitation.model";
import { Collaborator } from "./models/Project.model";

@Injectable({ providedIn: "root" })
export class SocketService {
  private socket: SocketIOClient.Socket;

  constructor() {
    this.socket = io(environment.serverUrl);
  }

  joinUserSession(userId: string) {
    this.socket.emit("joinUserSession", userId);
  }

  joinProjectSession(projectId: string) {
    this.socket.emit("joinProjectSession", projectId);
  }

  notifyFileContentsUpdate(projectId: string, updatedContents: string) {
    this.socket.emit("updateFileContents", projectId, updatedContents);
  }

  getUpdatedFileContents(): Observable<string> {
    return new Observable(observer => {
      this.socket.on("updateFileContents", (updatedContents: string) => {
        observer.next(updatedContents);
      });
    });
  }

  notifyInvitationChange(userId: string) {
    this.socket.emit("notifyInvitationChange", userId);
  }

  onInvitationChange(): Observable<Invitation> {
    return new Observable(observer => {
      this.socket.on("notifyInvitationChange", () => {
        observer.next();
      });
    });
  }

  notifyCollaboratorChange(userId: string) {
    this.socket.emit("notifyCollaboratorChange", userId);
  }

  onCollaboratorChange(): Observable<Collaborator> {
    return new Observable(observer => {
      this.socket.on("notifyCollaboratorChange", () => {
        observer.next();
      });
    });
  }
}
