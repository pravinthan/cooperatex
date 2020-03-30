import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { NewProjectDialogComponent } from "./new-project-dialog/new-project-dialog.component";
import { MatTableDataSource } from "@angular/material/table";
import { ProjectService } from "src/app/shared/project.service";
import { AuthenticationService } from "src/app/shared/authentication.service";
import { MatSort } from "@angular/material/sort";
import { DeleteProjectDialogComponent } from "./delete-project-dialog/delete-project-dialog.component";
import { Subscription } from "rxjs";
import { SocketService } from "src/app/shared/socket.service";
import { User } from "src/app/shared/models/user.model";
import { LeaveProjectDialogComponent } from "./leave-project-dialog/leave-project-dialog.component";

export interface ProjectTableData {
  _id: string;
  title: string;
  owner: User;
  lastUpdated: Date;
  lastUpdatedBy: string;
}

@Component({
  selector: "app-projects",
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.css"]
})
export class ProjectsComponent implements OnInit, OnDestroy {
  currentUser = this.authenticationService.currentUser;
  projectTableData: ProjectTableData[];
  displayedColumns: string[] = ["title", "owner", "lastUpdated", "actions"];
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatSort) sort: MatSort;
  selected: "all" | "mine" | "shared" = "all";
  onCollaboratorChangeSubscription: Subscription;
  onProjectAvailabilityChangeSubscription: Subscription;

  constructor(
    public dialog: MatDialog,
    private projectService: ProjectService,
    private authenticationService: AuthenticationService,
    private socketService: SocketService
  ) {
    if (!this.onCollaboratorChangeSubscription) {
      this.onCollaboratorChangeSubscription = this.socketService
        .onCollaboratorChange()
        .subscribe(() => this.refreshProjects());
    }

    if (!this.onProjectAvailabilityChangeSubscription) {
      this.onProjectAvailabilityChangeSubscription = this.socketService
        .onProjectAvailabilityChange()
        .subscribe(() => this.refreshProjects());
    }
  }

  ngOnDestroy() {
    if (this.onCollaboratorChangeSubscription)
      this.onCollaboratorChangeSubscription.unsubscribe();

    if (this.onProjectAvailabilityChangeSubscription)
      this.onProjectAvailabilityChangeSubscription.unsubscribe();
  }

  private refreshProjects() {
    this.projectTableData = [];
    this.projectService
      .getAllProjects()
      .toPromise()
      .then(projects => {
        // Construct table data
        projects.forEach(project => {
          this.projectTableData.push({
            _id: project._id,
            title: project.title,
            owner: project.owner,
            lastUpdated: project.lastUpdated,
            lastUpdatedBy: project.lastUpdatedBy.username
          });
        });

        // Update table
        this.dataSource.data = this.projectTableData;
        this.dataSource.sort = this.sort;
      });
  }

  ngOnInit() {
    this.refreshProjects();
  }

  // Search function
  applySearch(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Open a new project dialog
  openNewProjectDialog() {
    this.dialog.open(NewProjectDialogComponent, { width: "400px" });
  }

  // Show all projects
  filterByAllProjects() {
    this.dataSource.data = this.projectTableData;
    this.dataSource.sort = this.sort;
    this.selected = "all";
  }

  // Show projects owned by signed in user
  filterByYourProjects() {
    this.dataSource.data = this.projectTableData.filter(
      project => project.owner._id === this.currentUser._id
    );
    this.dataSource.sort = this.sort;
    this.selected = "mine";
  }

  // Show projects shared with signed in user
  filterByProjectsSharedWithYou() {
    this.dataSource.data = this.projectTableData.filter(
      project => project.owner._id !== this.currentUser._id
    );
    this.dataSource.sort = this.sort;
    this.selected = "shared";
  }

  // Open a delete project dialog
  openDeleteProjectDialog(projectTableData: ProjectTableData) {
    const dialogRef = this.dialog.open(DeleteProjectDialogComponent, {
      width: "400px",
      data: { title: projectTableData.title }
    });

    // Delete project by id and update table
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.projectService
          .deleteProjectById(projectTableData._id)
          .toPromise()
          .then(() => {
            this.refreshProjects();
          });
      }
    });
  }

  // Open a leave project dialog
  openLeaveProjectDialog(projectTableData: ProjectTableData) {
    const dialogRef = this.dialog.open(LeaveProjectDialogComponent, {
      width: "500px",
      data: { title: projectTableData.title }
    });

    // Remove the collaborator from the project and update table
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.projectService
          .removeCollaborator(projectTableData._id, this.currentUser._id)
          .toPromise()
          .then(() => {
            this.socketService.notifyCollaboratorChange(projectTableData.owner);
            this.refreshProjects();
          });
      }
    });
  }
}
