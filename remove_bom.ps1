$filePath = "postman/collections/Canvas LMS API Tests/Auth & Users/User Register.request.yaml"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "BOM detected, removing..."
    $noBom = $bytes[3..($bytes.Length-1)]
    [System.IO.File]::WriteAllBytes($filePath, $noBom)
    Write-Host "BOM removed"
} else {
    Write-Host "No BOM found"
}
