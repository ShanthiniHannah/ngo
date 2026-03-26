# Azure Deployment Script for ArcMission
# Prerequisites: Azure CLI installed and logged in (az login)

$RESOURCE_GROUP = "NGO-Management-RG-SEA"
$LOCATION = "southeastasia" # Switched to Singapore (SEA) based on policy findings
$APP_SERVICE_PLAN = "NGO-Plan-SEA"
$WEB_APP_NAME = "ngo-manager-" + (Get-Random -Maximum 10000)
$MYSQL_SERVER_NAME = "ngo-db-" + (Get-Random -Maximum 10000)
$MYSQL_USER = "ngoadmin"
$MYSQL_PASSWORD = "Password123!" # Change this!
$DB_NAME = "ngo_db"

Write-Host "--- Starting Azure Deployment ---" -ForegroundColor Cyan

# 1. Create Resource Group
Write-Host "Creating Resource Group: $RESOURCE_GROUP..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create Azure Database for MySQL (Flexible Server)
Write-Host "Creating Azure Database for MySQL (Flexible Server)... This may take a few minutes."
az mysql flexible-server create --resource-group $RESOURCE_GROUP --name $MYSQL_SERVER_NAME --location $LOCATION --admin-user $MYSQL_USER --admin-password $MYSQL_PASSWORD --sku-name Standard_B1ms --tier Burstable --public-access 0.0.0.0 --database-name $DB_NAME

$MYSQL_HOST = "$MYSQL_SERVER_NAME.mysql.database.azure.com"
$DATABASE_URL = "mysql+mysqlconnector://$($MYSQL_USER):$($MYSQL_PASSWORD)@$($MYSQL_HOST)/$($DB_NAME)"

# 3. Create App Service Plan
Write-Host "Creating App Service Plan..."
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --is-linux --sku F1 --location $LOCATION

# 4. Create Web App
Write-Host "Creating Web App: $WEB_APP_NAME..."
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $WEB_APP_NAME --runtime "PYTHON:3.11"

# 5. Configure App Settings
Write-Host "Configuring App Settings..."
$SECRET_KEY = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --settings DATABASE_URL=$DATABASE_URL SECRET_KEY=$SECRET_KEY FLASK_APP=app.py FLASK_DEBUG=1

# 6. Deploy Code
Write-Host "Ensuring Web App is started..."
az webapp start --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME

Write-Host "Deploying code using az webapp deploy..."
$zipFile = "deployment.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile }

# Explicitly list folders to include in zip to avoid venv/.git
$IncludePaths = @('app.py', 'database.py', 'models.py', 'helpers.py', 'requirements.txt', 'Procfile', 'static', 'templates', 'routes', 'services', 'ml_model')
Compress-Archive -Path $IncludePaths -DestinationPath $zipFile

az webapp deploy --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --src-path $zipFile

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
Write-Host "Your app is live at: https://$WEB_APP_NAME.azurewebsites.net"
