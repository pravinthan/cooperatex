import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from "rxjs";
import { Project, MulterFile, Collaborator } from "./models/Project.model";
import { Invitation } from "./models/invitation.model";

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
      { responseType: "blob" }
    );
  }

  deleteFile(projectId: string, fileId: string) {
    return this.http.delete(
      `${environment.apiUrl}/projects/${projectId}/files/${fileId}`,
      { responseType: "text" }
    );
  }

  private patchFile(
    projectId: string,
    fileId: string,
    operation: "replaceName" | "replaceMain" | "replaceContents",
    newName?: string,
    newContents?: string
  ) {
    return this.http.patch(
      `${environment.apiUrl}/projects/${projectId}/files/${fileId}`,
      { operation, newName, newContents },
      { responseType: "text" }
    );
  }

  renameFile(projectId: string, fileId: string, newName: string) {
    return this.patchFile(projectId, fileId, "replaceName", newName);
  }

  assignMainFile(projectId: string, fileId: string) {
    return this.patchFile(projectId, fileId, "replaceMain");
  }

  replaceFileContents(projectId: string, fileId: string, newContents: string) {
    return this.patchFile(
      projectId,
      fileId,
      "replaceContents",
      null,
      newContents
    );
  }

  getOutputFile(projectId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/projects/${projectId}/output`, {
      responseType: "blob"
    });
  }

  getCollaborators(projectId: string): Observable<Collaborator[]> {
    return this.http.get<any>(
      `${environment.apiUrl}/projects/${projectId}/collaborators`
    );
  }

  inviteCollaborator(
    projectId: string,
    username: string,
    access: "read" | "readWrite"
  ): Observable<Collaborator> {
    return this.http.post<any>(
      `${environment.apiUrl}/projects/${projectId}/collaborators`,
      { username: username, access }
    );
  }

  removeCollaborator(projectId: string, userId: string) {
    return this.http.delete(
      `${environment.apiUrl}/projects/${projectId}/collaborators/${userId}`,
      { responseType: "text" }
    );
  }

  private patchCollaborator(
    invitation: Invitation,
    operation: "accept" | "reject"
  ) {
    return this.http.patch(
      `${environment.apiUrl}/projects/${invitation.projectId}/collaborators/${invitation.to._id}`,
      { operation },
      { responseType: "text" }
    );
  }

  acceptInvitation(invitation: Invitation) {
    return this.patchCollaborator(invitation, "accept");
  }

  rejectInvitation(invitation: Invitation) {
    return this.patchCollaborator(invitation, "reject");
  }

  getInvitations(): Observable<Invitation[]> {
    return this.http.get<any>(`${environment.apiUrl}/invitations`);
  }
}
