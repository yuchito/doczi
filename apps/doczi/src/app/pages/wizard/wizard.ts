import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { MatSelectModule } from "@angular/material/select";
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-wizard',
  imports: [
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
  ],
  templateUrl: './wizard.html',
  styleUrl: './wizard.scss',
})
export class Wizard implements OnInit {

  readonly API_BASE_URL = environment.apiBaseUrl;

  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  templates = signal<any[]>([]);
  students = signal<any[]>([]);
  filtered = signal<any[]>([]);
  search = signal('');
  loading = signal(false);
  uploadSuccess = signal(false);
  previewStudent = signal<any | null>(null);

  form: FormGroup = this.fb.group({
    mode: ['bulk', Validators.required],      // <-- NEW mode field: 'bulk' or 'single'
    docType: [null, Validators.required],
    file: [null],                             // required only if bulk
    firstName: [''],                          // single mode fields
    lastName: [''],
    email: [''],
    grade: [''],
  });

  dataSource = computed(() => new MatTableDataSource(this.filtered()));

  token = localStorage.getItem('token') ?? '';

  ngOnInit() {
    this.fetchTemplates();
    this.fetchStudents();
  }

  fetchTemplates() {
    this.http
      .get<any[]>(`${this.API_BASE_URL}/templates`, { headers: this.authHeader() })
      .subscribe((res) => {
        this.templates.set(res);
        if (res.length) this.form.patchValue({ docType: res[0].id });
      });
  }

  fetchStudents() {
    this.loading.set(true);
    this.http
      .get<any[]>(`${this.API_BASE_URL}/wizard`, { headers: this.authHeader() })
      .subscribe({
        next: (res) => {
          this.students.set(res);
          this.filtered.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  upload(): void {
    if (this.form.value.mode !== 'bulk') {
      this.snackBar.open('Veuillez sélectionner le mode "Génération en masse" pour importer un fichier.', 'Fermer');
      return;
    }

    const file = this.form.value.file;
    if (!file) {
      this.snackBar.open('Aucun fichier sélectionné.', 'Fermer');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', this.form.value.docType);

    this.http
      .post<{ message: string; count: number }>(`${this.API_BASE_URL}/wizard/upload`, formData, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
      .subscribe({
        next: (res) => {
          this.uploadSuccess.set(true);
          this.snackBar.open(`${res.count} étudiants ont été importés avec succès.`, 'Fermer', { duration: 4000 });
          this.fetchStudents();
        },
        error: () => {
          this.snackBar.open("Échec de l'import", 'Fermer', { duration: 3000 });
        },
      });
  }

  generateOne() {
    if (this.form.value.mode !== 'single') {
      this.snackBar.open('Veuillez sélectionner le mode "Générer un seul" pour générer un document unique.', 'Fermer');
      return;
    }

    const student = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      email: this.form.value.email,
      grade: this.form.value.grade,
      docType: this.form.value.docType,
    };

    if (!student.firstName || !student.lastName || !student.email || !student.grade) {
      this.snackBar.open('Veuillez remplir tous les champs.', 'Fermer');
      return;
    }

    this.http.post(`${this.API_BASE_URL}/wizard/generate-one`, student, {
      headers: this.authHeader(),
      responseType: 'blob', // IMPORTANT: we expect a file blob response
    }).subscribe({
      next: (blob: Blob) => {
        // Trigger file download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${student.firstName}_${student.lastName}_document.docx`; // or use template name
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Document généré avec succès.', 'Fermer', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open("Erreur lors de la génération", 'Fermer');
      }
    });
  }

  handleSearch(value: string) {
    this.search.set(value);
    const q = value.toLowerCase();
    const filtered = this.students().filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    );
    this.filtered.set(filtered);
  }

  handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.form.patchValue({ file: input.files[0] });
    }
  }

  private authHeader(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });
  }

  downloadOne(student: any) {
    if (!this.form.value.docType) {
      this.snackBar.open('Veuillez sélectionner un type de document.', 'Fermer');
      return;
    }
    this.http
      .get(
        `${this.API_BASE_URL}/wizard/download-one/${student.id}?docType=${this.form.value.docType}`,
        {
          headers: this.authHeader(),
          responseType: 'blob',
        },
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${student.firstName}_${student.lastName}_document.docx`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.snackBar.open('Erreur lors du téléchargement', 'Fermer');
        },
      });
  }

  downloadAll() {
    if (!this.form.value.docType) {
      this.snackBar.open('Veuillez sélectionner un type de document.', 'Fermer');
      return;
    }
    this.http
      .get(`${this.API_BASE_URL}/wizard/download-all?docType=${this.form.value.docType}`, {
        headers: this.authHeader(),
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `documents_bulk.zip`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.snackBar.open('Erreur lors du téléchargement du ZIP', 'Fermer');
        },
      });
  }
}
