import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Project } from "./models/Project.model";
import { ActivatedRoute } from "@angular/router";

@Injectable({
  providedIn: "root"
})
export class ProjectService {
  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  createProject(title: string) {
    return this.http
      .post<any>(`${environment.apiUrl}/projects`, { title })
      .pipe(map(project => project));
  }

  getAllProjects(): Observable<Project[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/projects`)
      .pipe(map(projects => projects));
  }

  getProjectById(id: string) {
    return this.http
      .get<any>(`${environment.apiUrl}/projects/${id}`)
      .pipe(map(project => project));
  }

  deleteProjectById(id: string) {
    return this.http
      .delete<any>(`${environment.apiUrl}/projects/${id}`)
      .pipe(map(project => project));
  }

  postFile(fileToUpload: File): Observable<boolean> {
    const project_id = this.route.snapshot.paramMap.get('id');
    const endpoint = `${environment.apiUrl}/projects/${project_id}/files`;
    const formData: FormData = new FormData();
    formData.append('fileKey', fileToUpload, fileToUpload.name);
    return this.http
      .post(endpoint, formData)
      .pipe(map(() => { return true; }));
  }
}
