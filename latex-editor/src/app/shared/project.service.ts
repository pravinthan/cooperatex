import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import { Project, MulterFile } from "./models/Project.model";

@Injectable({
  providedIn: "root"
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  createProject(title: string): Observable<Project> {
    return this.http.post<any>(`${environment.apiUrl}/projects`, { title });
  }

  getAllProjects(): Observable<Project[]> {
    return this.http.get<any>(`${environment.apiUrl}/projects`);
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<any>(`${environment.apiUrl}/projects/${id}`);
  }

  deleteProjectById(id: string) {
    return this.http.delete(`${environment.apiUrl}/projects/${id}`, {
      responseType: "text"
    });
  }

  createFile(projectId: string, fileToUpload: File): Observable<MulterFile> {
    let formData = new FormData();
    formData.append("file", fileToUpload, fileToUpload.name);
    return this.http.post<any>(
      `${environment.apiUrl}/projects/${projectId}/files`,
      formData
    );
  }

  getAllFiles(projectId: string): Observable<MulterFile[]> {
    return this.http.get<any>(
      `${environment.apiUrl}/projects/${projectId}/files`
    );
  }

  getFileStream(projectId: string, fileId: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/projects/${projectId}/files/${fileId}`,
      {
        responseType: "blob"
      }
    );
  }

  deleteFile(projectId: string, fileId: string) {
    return this.http.delete(
      `${environment.apiUrl}/projects/${projectId}/files/${fileId}`,
      {
        responseType: "text"
      }
      );
  }
}
