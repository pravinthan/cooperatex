import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import * as io from "socket.io-client";
import { User } from "./models/user.model";

class CursorChange {
  updatedBy: User;
  cursorPos: { line: number; ch: number };
}

@Injectable({ providedIn: "root" })
export class SocketService {
  private socket: SocketIOClient.Socket;

  constructor() {
    this.socket = io(environment.serverUrl);
  }

  joinUserSession(userId: string) {
    this.socket.emit("joinUserSession", userId);
  }

  joinProjectSession(projectId: string, user: User) {
    this.socket.emit("joinProjectSession", projectId, user);
  }

  onJoinedProjectSession(): Observable<User> {
    return new Observable(observer => {
      this.socket.on("joinedProjectSession", (user: User) => {
        observer.next(user);
      });
    });
  }

  onActiveUserIdsInProjectSession(): Observable<string[]> {
    return new Observable(observer => {
      this.socket.on("activeUserIdsInProjectSession", (userIds: string[]) => {
        observer.next(userIds);
      });
    });
  }

  leaveProjectSession(projectId: string, user: User) {
    this.socket.emit("leaveProjectSession", projectId, user);
  }

  onLeftProjectSession(): Observable<User> {
    return new Observable(observer => {
      this.socket.on("leftProjectSession", (user: User) => {
        observer.next(user);
      });
    });
  }

  notifyCursorChange(projectId: string, cursorChange: CursorChange) {
    this.socket.emit("cursorChange", projectId, cursorChange);
  }

  onCursorChange(): Observable<CursorChange> {
    return new Observable(observer => {
      this.socket.on("cursorChange", (cursorChange: CursorChange) => {
        observer.next(cursorChange);
      });
    });
  }

  notifyFileContentsChange(projectId: string, newContents: string) {
    this.socket.emit("fileContentsChange", projectId, newContents);
  }

  onFileContentsChange(): Observable<string> {
    return new Observable(observer => {
      this.socket.on("fileContentsChange", (newContents: string) => {
        observer.next(newContents);
      });
    });
  }

  notifyInvitationChange(user: User) {
    this.socket.emit("invitationChange", user);
  }

  onInvitationChange() {
    return new Observable(observer => {
      this.socket.on("invitationChange", () => {
        observer.next();
      });
    });
  }

  notifyCollaboratorChange(user: User) {
    this.socket.emit("collaboratorChange", user);
  }

  onCollaboratorChange() {
    return new Observable(observer => {
      this.socket.on("collaboratorChange", () => {
        observer.next();
      });
    });
  }

  notifyProjectAvailabilityChange(user: User) {
    this.socket.emit("projectAvailabilityChange", user);
  }

  onProjectAvailabilityChange() {
    return new Observable(observer => {
      this.socket.on("projectAvailabilityChange", () => {
        observer.next();
      });
    });
  }
}
