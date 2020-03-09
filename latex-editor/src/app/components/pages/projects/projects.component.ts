import { Component, OnInit } from '@angular/core';

export interface PeriodicElement {
  title: string;
  position: number;
  owner: string;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, title: 'Hydrogen', owner: "You", symbol: 'H' },
  { position: 2, title: 'Helium', owner: "You", symbol: 'He' },
  { position: 3, title: 'Lithium', owner: "You", symbol: 'Li' },
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
  displayedColumns: string[] = ['position', 'title', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;

}
