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

  uploadFiles(
    projectId: string,
    filesToUpload: File[]
  ): Observable<MulterFile[]> {
    let formData = new FormData();
    filesToUpload.forEach(fileToUpload => {
      formData.append("files", fileToUpload, fileToUpload.name);
    });
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

  patchFile(
    projectId: string,
    fileId: string,
    operation: "replaceName" | "replaceMain",
    newName?: string
  ) {
    return this.http.patch(
      `${environment.apiUrl}/projects/${projectId}/files/${fileId}`,
      newName ? { operation, newName } : { operation },
      {
        responseType: "text"
      }
    );
  }

  getOutputFile(projectId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/projects/${projectId}/output`, {
      responseType: "blob"
    });
  }
}
