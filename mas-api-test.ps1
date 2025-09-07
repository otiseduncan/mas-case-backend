# ==============================
# MAS Case Backend API Test Script (Auto Case Create)
# ==============================

# --- Config ---
$baseUrl = "http://localhost:3000"
$email = "admin@masdemo.com"
$password = "Admin!234"

Write-Host "Logging in as $email ..."

# --- Step 1: Login ---
$response = curl -Method Post `
  -Uri "$baseUrl/api/auth/login" `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body "{ `"email`": `"$email`", `"password`": `"$password`" }"

$data = $response.Content | ConvertFrom-Json
$accessToken = $data.accessToken
$refreshToken = $data.refreshToken
$userId = $data.user.id

Write-Host "Login successful"
Write-Host "AccessToken (short): $($accessToken.Substring(0,30))..."
Write-Host "UserId: $userId"

# --- Step 2: List existing cases ---
Write-Host "`nFetching all cases..."
$cases = curl -Method Get `
  -Uri "$baseUrl/api/cases" `
  -Headers @{ "Authorization" = "Bearer $accessToken" }

$cases.Content | ConvertFrom-Json | Format-Table id,roNumber,vin,status,priority

# --- Step 3: Create a new case ---
# Generate random RO# and VIN
$randomRO = "RO" + (Get-Random -Minimum 10000 -Maximum 99999)
$randomVIN = "1HGCM82633A" + (Get-Random -Minimum 100000 -Maximum 999999)

$newCaseBody = "{ `"roNumber`": `"$randomRO`", `"vin`": `"$randomVIN`", `"issueType`": `"Calibration`", `"priority`": `"high`", `"summary`": `"Auto-created case from script`", `"notes`": `"Demo run`" }"

Write-Host "`nCreating new case with RO#: $randomRO and VIN: $randomVIN ..."

$newCase = curl -Method Post `
  -Uri "$baseUrl/api/cases" `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $accessToken" } `
  -Body $newCaseBody

$newCaseData = $newCase.Content | ConvertFrom-Json
$caseId = $newCaseData.id

Write-Host "✅ Created new case with ID: $caseId"

# --- Step 4: Add a note to the new case ---
Write-Host "`nAdding note to case $caseId ..."
$noteBody = "{ `"body`": `"Technician note added via automated script`" }"

$noteResponse = curl -Method Post `
  -Uri "$baseUrl/api/cases/$caseId/notes" `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $accessToken" } `
  -Body $noteBody

$noteResponse.Content | ConvertFrom-Json

# --- Step 5: Fetch updated case details ---
Write-Host "`nFetching updated case details..."
$caseDetails = curl -Method Get `
  -Uri "$baseUrl/api/cases/$caseId" `
  -Headers @{ "Authorization" = "Bearer $accessToken" }

$caseDetails.Content | ConvertFrom-Json | Format-List


