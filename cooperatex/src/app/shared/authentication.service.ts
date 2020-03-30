import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { SocketService } from "./socket.service";
import { User } from "./models/user.model";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUserObservable: Observable<any>;

  constructor(private http: HttpClient, private socketService: SocketService) {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem("currentUser"))
    );

    if (this.currentUserSubject.value && this.currentUserSubject.value.token)
      this.socketService.joinUserSession(this.currentUserId);

    this.currentUserObservable = this.currentUserSubject.asObservable();

    this.currentUserObservable.subscribe(token => {
      if (token) this.socketService.joinUserSession(this.currentUserId);
    });
  }

  private parseJWT(token: string) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  }

  public get currentUser(): User {
    if (this.currentUserSubject.value) {
      const token = this.parseJWT(this.currentUserSubject.value.token);
      if (token) return new User(token._id, token.username);
    }

    return null;
  }

  public get currentUserId(): string {
    return this.parseJWT(this.currentUserSubject.value.token)._id;
  }

  public get currentUsername(): string {
    return this.parseJWT(this.currentUserSubject.value.token).username;
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  signUp(username: string, password: string) {
    return this.http
      .post<any>(`${environment.apiUrl}/users/signup`, { username, password })
      .pipe(
        map(user => {
          localStorage.setItem("currentUser", JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        })
      );
  }

  signIn(username: string, password: string) {
    return this.http
      .post<any>(`${environment.apiUrl}/users/signin`, { username, password })
      .pipe(
        map(user => {
          localStorage.setItem("currentUser", JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        })
      );
  }

  signOut() {
    localStorage.removeItem("currentUser");
    this.currentUserSubject.next(null);
  }
}
