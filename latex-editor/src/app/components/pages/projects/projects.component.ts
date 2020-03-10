import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


export interface ProjectList {
  title: string;
  position: number;
  owner: string;
  action: string;
}

export interface DialogData {
  projectTitle: string
}

const ELEMENT_DATA: ProjectList[] = [
  { position: 1, title: 'a1', owner: "You", action: 'a' },
  { position: 2, title: 'a2', owner: "You", action: 'b' },
  { position: 3, title: 'a3', owner: "You", action: 'c' },
];

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  projectTitle: string

  ngOnInit(): void {}

  displayedColumns: string[] = ['position', 'title', 'owner', 'action'];
  dataSource = ELEMENT_DATA;

  clickAction(row){
    console.log(row);
  }

  openDialog(){
    const dialogRef = this.dialog.open(NewProjectDialog, {
      width: '250px',
      data: {title: this.projectTitle}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.projectTitle = result;
    });
  }

}

@Component({
  selector: 'new-project-dialog',
  templateUrl: 'new-project-dialog.html'
})
export class NewProjectDialog {

  constructor(
    public dialogRef: MatDialogRef<NewProjectDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}