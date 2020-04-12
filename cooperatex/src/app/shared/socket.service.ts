import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import * as io from "socket.io-client";
import { User } from "./models/user.model";
import { AuthenticationService } from "./authentication.service";

class CursorChange {
  updatedBy: User;
  cursorPos: CodeMirror.Position;
}

class SelectionChange {
  updatedBy: User;
  from: CodeMirror.Position;
  to: CodeMirror.Position;
}

@Injectable({ providedIn: "root" })
export class SocketService {
  private socket: SocketIOClient.Socket;

  constructor(private authenticationService: AuthenticationService) {
    const connect = (token: string) => {
      if (token) {
        this.socket = io(environment.serverUrl, {
          query: { auth_token: token },
        });

        this.joinUserSession();
      }
    };

    this.authenticationService.currentUserObservable.subscribe(
      (currentUser) => {
        if (currentUser && (!this.socket || this.socket.disconnected))
          connect(currentUser.token);
        else if (this.socket) this.socket.close();
      }
    );
  }

  joinUserSession() {
    this.socket.emit("joinUserSession");
  }

  joinProjectSession(projectId: string) {
    this.socket.emit("joinProjectSession", projectId);
  }

  onJoinedProjectSession(): Observable<User> {
    return new Observable((observer) => {
      this.socket.on("joinedProjectSession", (user: User) => {
        observer.next(user);
      });
    });
  }

  onActiveUserIdsInProjectSession(): Observable<string[]> {
    return new Observable((observer) => {
      this.socket.on("activeUserIdsInProjectSession", (userIds: string[]) => {
        observer.next(userIds);
      });
    });
  }

  leaveProjectSession(projectId: string) {
    this.socket.emit("leaveProjectSession", projectId);
  }

  onLeftProjectSession(): Observable<User> {
    return new Observable((observer) => {
      this.socket.on("leftProjectSession", (user: User) => {
        observer.next(user);
      });
    });
  }

  notifyProjectChange(projectId: string) {
    this.socket.emit("projectChange", projectId);
  }

  onProjectChange() {
    return new Observable((observer) => {
      this.socket.on("projectChange", () => {
        observer.next();
      });
    });
  }

  notifyCursorChange(projectId: string, cursorChange: CursorChange) {
    this.socket.emit("cursorChange", projectId, cursorChange);
  }

  onCursorChange(): Observable<CursorChange> {
    return new Observable((observer) => {
      this.socket.on("cursorChange", (cursorChange: CursorChange) => {
        observer.next(cursorChange);
      });
    });
  }

  notifySelectionChange(projectId: string, selectionChange: SelectionChange) {
    this.socket.emit("selectionChange", projectId, selectionChange);
  }

  onSelectionChange(): Observable<SelectionChange> {
    return new Observable((observer) => {
      this.socket.on("selectionChange", (selectionChange: SelectionChange) => {
        observer.next(selectionChange);
      });
    });
  }

  notifyFileContentsChange(projectId: string, newContents: string) {
    this.socket.emit("fileContentsChange", projectId, newContents);
  }

  onFileContentsChange(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on("fileContentsChange", (newContents: string) => {
        observer.next(newContents);
      });
    });
  }

  notifyInvitationChange(user: User) {
    this.socket.emit("invitationChange", user);
  }

  onInvitationChange() {
    return new Observable((observer) => {
      this.socket.on("invitationChange", () => {
        observer.next();
      });
    });
  }

  notifyCollaboratorChange(user: User) {
    this.socket.emit("collaboratorChange", user);
  }

  onCollaboratorChange() {
    return new Observable((observer) => {
      this.socket.on("collaboratorChange", () => {
        observer.next();
      });
    });
  }

  notifyProjectAvailabilityChange(user: User) {
    this.socket.emit("projectAvailabilityChange", user);
  }

  onProjectAvailabilityChange() {
    return new Observable((observer) => {
      this.socket.on("projectAvailabilityChange", () => {
        observer.next();
      });
    });
  }
}
