import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule, MatLabel } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-template-dialog',
  imports: [
    MatDialogActions,
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatLabel,
  ],
  templateUrl: './template-dialog.html',
  styleUrl: './template-dialog.scss',
})
export class TemplateDialog {
  readonly API_BASE_URL = environment.apiBaseUrl;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  protected dialogRef = inject(MatDialogRef<TemplateDialog>);
  token = localStorage.getItem('token') ?? '';

  form: FormGroup = this.fb.group({
    name: [''],
    type: [''],
    file: [null],
  });

  data = inject(MAT_DIALOG_DATA);

  constructor() {
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        type: this.data.type
      });
    }
  }

  handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.form.patchValue({file: input.files[0]});
    }
  }

  saveTemplate() {
    const formValue = this.form.value;
    const formData = new FormData();
    formData.append('name', formValue.name);
    formData.append('type', formValue.type);
    if (formValue.file) formData.append('file', formValue.file);

    const template = this.data;
    const endpoint = template ? `/templates/${template.id}` : `/templates/upload`;
    const url = `${this.API_BASE_URL}${endpoint}`;    const method = template ? 'patch' : 'post';
    this.http[method](url, formData, {
      headers: new HttpHeaders({Authorization: `Bearer ${this.token}`})
    }).subscribe({
      next: () => this.dialogRef.close('saved'),
      error: () => alert('Erreur lors de l’enregistrement')
    });
  }
}
