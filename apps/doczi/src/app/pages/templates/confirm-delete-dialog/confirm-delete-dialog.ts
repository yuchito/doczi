import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatDialogContent, MatDialogActions, MatButtonModule],
  templateUrl: './confirm-delete-dialog.html',
  styleUrl: './confirm-delete-dialog.scss',
})
export class ConfirmDeleteDialog {
  private http = inject(HttpClient);
  protected dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);
  token = localStorage.getItem('token') ?? '';

  data = inject(MAT_DIALOG_DATA);

  delete() {
    this.http.delete(`http://localhost:3000/templates/${this.data.id}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.token}` })
    }).subscribe({
      next: () => this.dialogRef.close('deleted'),
      error: () => alert('Erreur lors de la suppression.')
    });
  }
}
