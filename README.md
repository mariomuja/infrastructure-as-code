# Infrastructure as Code - CSV to SQL Server Transport

Webanwendung zur Demonstration des Datentransports von CSV-Dateien in eine SQL Server Datenbank über Azure Services.

## Architektur

- **Frontend**: Angular mit Material Design
- **Backend**: Vercel Serverless Functions
- **Infrastructure**: Terraform für Azure-Komponenten
- **Azure Services**: 
  - SQL Server Database
  - Blob Storage
  - Event Grid
  - Azure Functions

## Setup

1. Terraform-Konfiguration anpassen (terraform/terraform.tfvars)
2. Azure-Login durchführen: `az login`
3. Infrastructure deployen: `cd terraform && terraform init && terraform apply`
4. Frontend bauen: `cd frontend && npm install && npm run build`
5. Deployment nach Vercel: `vercel deploy --prod`


