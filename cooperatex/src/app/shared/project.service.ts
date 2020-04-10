import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Project } from "./models/project.model";
import { Invitation } from "./models/invitation.model";
import { MulterFile } from "./models/multer-file.model";
import { Collaborator } from "./models/collaborator.model";

export type LatexTemplate = "default" | "cover-letter" | "title-page";

@Injectable({ providedIn: "root" })
export class ProjectService {
  constructor(private http: HttpClient) {}

  createProject(title: string, template: LatexTemplate): Observable<Project> {
    return this.http.post<any>(`/api/projects`, {
      title,
      template,
    });
  }

  getAllProjects(): Observable<Project[]> {
    return this.http.get<any>(`/api/projects`);
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<any>(`/api/projects/${id}`);
  }

  deleteProjectById(id: string) {
    return this.http.delete(`/api/projects/${id}`, {
      responseType: "text",
    });
  }

  uploadFiles(
    projectId: string,
    filesToUpload: File[]
  ): Observable<MulterFile[]> {
    let formData = new FormData();
    filesToUpload.forEach((fileToUpload) => {
      formData.append("files", fileToUpload, fileToUpload.name);
    });
    return this.http.post<any>(`/api/projects/${projectId}/files`, formData);
  }

  getAllFiles(projectId: string): Observable<MulterFile[]> {
    return this.http.get<any>(`/api/projects/${projectId}/files`);
  }

  getFileStream(projectId: string, fileId: string): Observable<Blob> {
    return this.http.get(`/api/projects/${projectId}/files/${fileId}`, {
      responseType: "blob",
    });
  }

  deleteFile(projectId: string, fileId: string) {
    return this.http.delete(`/api/projects/${projectId}/files/${fileId}`, {
      responseType: "text",
    });
  }

  private patchFile(
    projectId: string,
    fileId: string,
    operation: "replaceName" | "replaceMain" | "replaceContents",
    newName?: string,
    newContents?: string
  ) {
    return this.http.patch(
      `/api/projects/${projectId}/files/${fileId}`,
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
    return this.http.get(`/api/projects/${projectId}/output`, {
      responseType: "blob",
    });
  }

  getSourceFiles(projectId: string): Observable<ArrayBuffer> {
    return this.http.get(`/api/projects/${projectId}/source`, {
      responseType: "arraybuffer",
    });
  }

  getCollaborators(projectId: string): Observable<Collaborator[]> {
    return this.http.get<any>(`/api/projects/${projectId}/collaborators`);
  }

  inviteCollaborator(
    projectId: string,
    username: string,
    access: "read" | "readWrite"
  ): Observable<Collaborator> {
    return this.http.post<any>(`/api/projects/${projectId}/collaborators`, {
      username: username,
      access,
    });
  }

  removeCollaborator(projectId: string, userId: string) {
    return this.http.delete(
      `/api/projects/${projectId}/collaborators/${userId}`,
      { responseType: "text" }
    );
  }

  private patchCollaborator(projectId: string, operation: "accept" | "reject") {
    return this.http.patch(
      `/api/projects/${projectId}/collaborators`,
      { operation },
      { responseType: "text" }
    );
  }

  acceptInvitation(projectId: string) {
    return this.patchCollaborator(projectId, "accept");
  }

  rejectInvitation(projectId: string) {
    return this.patchCollaborator(projectId, "reject");
  }

  getInvitations(): Observable<Invitation[]> {
    return this.http.get<any>(`/api/invitations`);
  }
}
