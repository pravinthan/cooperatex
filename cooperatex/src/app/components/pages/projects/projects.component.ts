import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { NewProjectDialogComponent } from "./new-project-dialog/new-project-dialog.component";
import { MatTableDataSource } from "@angular/material/table";
import { ProjectService } from "src/app/shared/project.service";
import { AuthenticationService } from "src/app/shared/authentication.service";
import { MatSort } from "@angular/material/sort";
import { DeleteProjectDialogComponent } from "./delete-project-dialog/delete-project-dialog.component";

export interface ProjectTableData {
  _id: string;
  title: string;
  owner: string;
  lastUpdated: Date;
  lastUpdatedBy: string;
}

@Component({
  selector: "app-projects",
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.css"]
})
export class ProjectsComponent implements OnInit {
  currentUsername = this.authenticationService.currentUsername;
  projectTableData: ProjectTableData[];
  displayedColumns: string[] = ["title", "owner", "lastUpdated", "actions"];
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatSort) sort: MatSort;
  selected: "all" | "mine" | "shared" = "all";

  constructor(
    public dialog: MatDialog,
    private projectService: ProjectService,
    private authenticationService: AuthenticationService
  ) {}

  private getProjects() {
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
            owner: project.owner.username,
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
    this.getProjects();
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
      project => project.owner === this.currentUsername
    );
    this.dataSource.sort = this.sort;
    this.selected = "mine";
  }

  // Show projects shared with signed in user
  filterByProjectsSharedWithYou() {
    this.dataSource.data = this.projectTableData.filter(
      project => project.owner !== this.currentUsername
    );
    this.dataSource.sort = this.sort;
    this.selected = "shared";
  }

  // Open a delete project dialog
  openDeleteProjectDialog(id: string, title: string) {
    const dialogRef = this.dialog.open(DeleteProjectDialogComponent, {
      data: { title }
    });

    // Delete project by id and update table
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.projectService
          .deleteProjectById(id)
          .toPromise()
          .then(() => {
            this.getProjects();
          });
      }
    });
  }
}
