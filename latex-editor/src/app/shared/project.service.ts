import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  createProject(title: string) {
    return this.http
      .post<any>(`${environment.apiUrl}/projects`, { title })
      .pipe(map(project => project));
  }

  getAllProjects() {
    return this.http
      .get<any>(`${environment.apiUrl}/projects`)
      .pipe(map(projects => projects));
  }

  getProjectById(id: string) {
    return this.http
      .get<any>(`${environment.apiUrl}/projects/${id}`)
      .pipe(map(project => project));
  }
}
