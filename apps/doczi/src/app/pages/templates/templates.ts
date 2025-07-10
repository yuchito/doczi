import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import { TemplateDialog } from './template-dialog/template-dialog';
import { ConfirmDeleteDialog } from './confirm-delete-dialog/confirm-delete-dialog';
import { MatCard } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { MatChip } from "@angular/material/chips";
import { MatButtonModule } from "@angular/material/button";
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.html',
  imports: [
    MatIcon,
    MatCard,
    MatChip,
    MatTableModule,
    MatButtonModule,
  ],
  styleUrls: ['./templates.scss']
})
export class Templates implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  templates = signal<any[]>([]);
  dataSource = computed(() => new MatTableDataSource(this.templates()));
  displayedColumns = ['name', 'description', 'type', 'actions'];
  readonly API_BASE_URL = environment.apiBaseUrl;

  token = localStorage.getItem('token') ?? '';

  ngOnInit(): void {
    this.fetchTemplates();
  }

  fetchTemplates() {
    this.http.get<any[]>(`${this.API_BASE_URL}/templates`, { headers: this.authHeader() })
      .subscribe(res => this.templates.set(res));
  }

  openTemplateDialog(template?: any) {
    const dialogRef = this.dialog.open(TemplateDialog, {
      width: '800px',
      height: "600px",
      data: template
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.fetchTemplates();
        this.snackBar.open('Modèle enregistré !', 'Fermer', { duration: 3000 });
      }
    });
  }

  openDeleteDialog(template: any) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '400px',
      data: template
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'deleted') {
        this.fetchTemplates();
        this.snackBar.open('Modèle supprimé.', 'Fermer', { duration: 3000 });
      }
    });
  }

  private authHeader(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }
}
