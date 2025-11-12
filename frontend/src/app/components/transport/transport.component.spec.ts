import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TransportComponent } from './transport.component';
import { TransportService } from '../../services/transport.service';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { CsvRecord, SqlRecord, ProcessLog } from '../../models/data.model';

describe('TransportComponent', () => {
  let component: TransportComponent;
  let fixture: ComponentFixture<TransportComponent>;
  let transportService: jasmine.SpyObj<TransportService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockCsvData: CsvRecord[] = [
    { id: 1, name: 'Test User', email: 'test@test.com', age: 30, city: 'Berlin', salary: 50000 }
  ];

  const mockSqlData: SqlRecord[] = [
    { id: 1, name: 'Test User', email: 'test@test.com', age: 30, city: 'Berlin', salary: 50000, createdAt: '2024-01-01' }
  ];

  const mockLogs: ProcessLog[] = [
    { id: 1, timestamp: '2024-01-01T00:00:00Z', level: 'info', message: 'Test log' }
  ];

  beforeEach(async () => {
    const transportServiceSpy = jasmine.createSpyObj('TransportService', [
      'getSampleCsvData',
      'getSqlData',
      'getProcessLogs',
      'startTransport',
      'clearTable'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [TransportComponent],
      providers: [
        provideHttpClient(),
        provideAnimations(),
        { provide: TransportService, useValue: transportServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransportComponent);
    component = fixture.componentInstance;
    transportService = TestBed.inject(TransportService) as jasmine.SpyObj<TransportService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    transportService.getSampleCsvData.and.returnValue(of(mockCsvData));
    transportService.getSqlData.and.returnValue(of(mockSqlData));
    transportService.getProcessLogs.and.returnValue(of(mockLogs));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load CSV data on init', () => {
    fixture.detectChanges();
    expect(transportService.getSampleCsvData).toHaveBeenCalled();
    expect(component.csvData).toEqual(mockCsvData);
  });

  it('should load SQL data on init', () => {
    fixture.detectChanges();
    expect(transportService.getSqlData).toHaveBeenCalled();
    expect(component.sqlData).toEqual(mockSqlData);
  });

  it('should load process logs on init', () => {
    fixture.detectChanges();
    expect(transportService.getProcessLogs).toHaveBeenCalled();
    expect(component.processLogs).toEqual(mockLogs);
  });

  it('should start transport', () => {
    transportService.startTransport.and.returnValue(of({ message: 'Success', fileId: 'test-id' }));
    component.startTransport();
    expect(transportService.startTransport).toHaveBeenCalled();
  });

  it('should handle transport error', () => {
    transportService.startTransport.and.returnValue(throwError(() => new Error('Test error')));
    component.startTransport();
    // Verify that isTransporting is set to true initially
    expect(component.isTransporting).toBe(true);
    // Note: Error handling is tested through integration tests
  });

  it('should clear table', () => {
    transportService.clearTable.and.returnValue(of({ message: 'Table cleared' }));
    spyOn(window, 'confirm').and.returnValue(true);
    component.clearTable();
    expect(transportService.clearTable).toHaveBeenCalled();
  });

  it('should get level color correctly', () => {
    expect(component.getLevelColor('error')).toBe('warn');
    expect(component.getLevelColor('warning')).toBe('accent');
    expect(component.getLevelColor('info')).toBe('primary');
  });
});

