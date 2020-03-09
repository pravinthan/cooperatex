import { Component, OnInit } from '@angular/core';

export interface ProjectList {
  title: string;
  position: number;
  owner: string;
  action: string;
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

  constructor() { }

  ngOnInit(): void {

  }
  displayedColumns: string[] = ['position', 'title', 'owner', 'action'];
  dataSource = ELEMENT_DATA;

  clickAction(row){
    console.log(row);
  }

}
