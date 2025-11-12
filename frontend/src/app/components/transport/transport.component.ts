import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TransportService } from '../../services/transport.service';
import { CsvRecord, SqlRecord, ProcessLog } from '../../models/data.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './transport.component.html',
  styleUrl: './transport.component.css'
})
export class TransportComponent implements OnInit, OnDestroy {
  csvData: CsvRecord[] = [];
  sqlData: SqlRecord[] = [];
  processLogs: ProcessLog[] = [];
  isLoading = false;
  isTransporting = false;
  private refreshSubscription?: Subscription;

  csvDisplayedColumns: string[] = ['id', 'name', 'email', 'age', 'city', 'salary'];
  sqlDisplayedColumns: string[] = ['id', 'name', 'email', 'age', 'city', 'salary', 'createdAt'];
  logDisplayedColumns: string[] = ['timestamp', 'level', 'message', 'details'];

  constructor(
    private transportService: TransportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSampleCsvData();
    this.loadSqlData();
    this.loadProcessLogs();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSampleCsvData(): void {
    this.isLoading = true;
    this.transportService.getSampleCsvData().subscribe({
      next: (data) => {
        this.csvData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading CSV data:', error);
        this.snackBar.open('Fehler beim Laden der CSV-Daten', 'Schließen', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadSqlData(): void {
    this.transportService.getSqlData().subscribe({
      next: (data) => {
        this.sqlData = data;
      },
      error: (error) => {
        console.error('Error loading SQL data:', error);
        this.snackBar.open('Fehler beim Laden der SQL-Daten', 'Schließen', { duration: 3000 });
      }
    });
  }

  loadProcessLogs(): void {
    this.transportService.getProcessLogs().subscribe({
      next: (logs) => {
        this.processLogs = logs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },
      error: (error) => {
        console.error('Error loading process logs:', error);
      }
    });
  }

  startTransport(): void {
    this.isTransporting = true;
    this.transportService.startTransport().subscribe({
      next: (response) => {
        this.snackBar.open('Transport gestartet: ' + response.message, 'Schließen', { duration: 5000 });
        this.isTransporting = false;
        setTimeout(() => {
          this.loadSqlData();
          this.loadProcessLogs();
        }, 2000);
      },
      error: (error) => {
        console.error('Error starting transport:', error);
        this.snackBar.open('Fehler beim Starten des Transports', 'Schließen', { duration: 3000 });
        this.isTransporting = false;
      }
    });
  }

  clearTable(): void {
    if (confirm('Möchten Sie wirklich alle Daten aus der Tabelle löschen?')) {
      this.transportService.clearTable().subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Schließen', { duration: 3000 });
          this.loadSqlData();
          this.loadProcessLogs();
        },
        error: (error) => {
          console.error('Error clearing table:', error);
          this.snackBar.open('Fehler beim Löschen der Tabelle', 'Schließen', { duration: 3000 });
        }
      });
    }
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.loadSqlData();
      this.loadProcessLogs();
    });
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'error': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }
}


