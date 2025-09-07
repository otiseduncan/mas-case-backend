# ==============================
# MAS Case Backend API Test Script
# ==============================

# --- Config ---
$baseUrl = "http://localhost:3000"
$email = "admin@masdemo.com"
$password = "Admin!234"
$caseId = "cmf9kr1b3000754d3fy3r9v2j"   # Change to whichever case you want to test

Write-Host "🔑 Logging in as $email ..."

# --- Step 1: Login ---
$response = curl -Method Post `
  -Uri "$baseUrl/api/auth/login" `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body "{ `"email`": `"$email`", `"password`": `"$password`" }"

$data = $response.Content | ConvertFrom-Json
$accessToken = $data.accessToken
$refreshToken = $data.refreshToken
$userId = $data.user.id

Write-Host "✅ Logged in!"
Write-Host "AccessToken (short): $($accessToken.Substring(0,30))..."
Write-Host "UserId: $userId"

# --- Step 2: List Cases ---
Write-Host "`n📋 Fetching all cases..."
$cases = curl -Method Get `
  -Uri "$baseUrl/api/cases" `
  -Headers @{ "Authorization" = "Bearer $accessToken" }

$cases.Content | ConvertFrom-Json | Format-Table id,roNumber,vin,status,priority

# --- Step 3: Add Note to Case ---
Write-Host "`n📝 Adding note to case $caseId ..."
$noteBody = '{ "body": "Technician note added via PowerShell script" }'

$noteResponse = curl -Method Post `
  -Uri "$baseUrl/api/cases/$caseId/notes" `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $accessToken" } `
  -Body $noteBody

$noteResponse.Content | ConvertFrom-Json

# --- Step 4: Fetch Updated Case Details ---
Write-Host "`n🔍 Fetching updated case details..."
$caseDetails = curl -Method Get `
  -Uri "$baseUrl/api/cases/$caseId" `
  -Headers @{ "Authorization" = "Bearer $accessToken" }

$caseDetails.Content | ConvertFrom-Json | Format-List
