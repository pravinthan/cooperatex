import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import * as CodeMirror from "codemirror";
import { ProjectService } from "src/app/shared/project.service";

@Component({
  selector: "app-project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.css"]
})
export class ProjectComponent implements OnInit, AfterViewInit {
  @ViewChild("editor") private editor;

  latex: string;
  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    // Retrieve data from service
    this.latex = "qwe";
  }

  ngAfterViewInit() {
    const codeMirror = this.editor.codeMirror;
    codeMirror.setSize("100%", "100%");

    let document = codeMirror.getDoc();
    console.log(document);
  }
}
