# ===== PARAMETERS =====
Param(
    [int]$RefreshInterval = 1000
)

# ===== AUTO DETECT ACTIVE ADAPTER =====
function Get-ActiveAdapter {

    $stats = Get-NetAdapterStatistics | 
    Sort-Object ReceivedBytes -Descending

    return $stats[0].Name
}

$adapter = Get-ActiveAdapter

# ===== VARIABLES =====
$prevRecv = 0
$prevSent = 0

$maxDown = 1
$maxUp = 1

$totalDown = 0
$totalUp = 0

$updates = 0
$width = 40

# ===== SPEED BAR FUNCTION =====
function Draw-Bar($value, $max, $char) {

    if ($max -eq 0) { $max = 1 }

    $size = [math]::Round(($value / $max) * $width)

    if ($size -lt 1) { $size = 1 }
    if ($size -gt $width) { $size = $width }

    return ($char * $size)
}

# ===== GET INITIAL STATS =====
$stats = Get-NetAdapterStatistics -Name $adapter

$prevRecv = $stats.ReceivedBytes
$prevSent = $stats.SentBytes

# ===== MAIN LOOP =====
while ($true) {

    # ===== TURBO TRAFFIC =====
    try {
        Invoke-WebRequest "https://hutch.lk/" -UseBasicParsing -TimeoutSec 3 | Out-Null
    }
    catch {}

    try {
        Invoke-WebRequest "https://www.cloudflare.com" -UseBasicParsing -TimeoutSec 3 | Out-Null
    }
    catch {}

    try {
        Invoke-WebRequest "https://www.google.com" -UseBasicParsing -TimeoutSec 3 | Out-Null
    }
    catch {}

    Start-Sleep -Milliseconds $RefreshInterval

    # ===== GET CURRENT STATS =====
    $stats = Get-NetAdapterStatistics -Name $adapter

    $downBytes = $stats.ReceivedBytes - $prevRecv
    $upBytes = $stats.SentBytes - $prevSent

    $prevRecv = $stats.ReceivedBytes
    $prevSent = $stats.SentBytes

    $downKB = [math]::Round($downBytes / 1024, 2)
    $upKB = [math]::Round($upBytes / 1024, 2)

    $totalDown += $downKB
    $totalUp += $upKB

    if ($downKB -gt $maxDown) { $maxDown = $downKB }
    if ($upKB -gt $maxUp) { $maxUp = $upKB }

    $updates++

    Clear-Host

    # ===== DASHBOARD =====
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "             HUTCH TURBO DASHBOARD" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green

    Write-Host ("Adapter : " + $adapter)
    Write-Host ("Time    : " + (Get-Date -Format "HH:mm:ss"))
    Write-Host ("Updates : " + $updates)

    Write-Host ""

    Write-Host ("Download Speed : " + $downKB + " KB/s  (" + [math]::Round($downKB / 1024, 2) + " MB/s)   Peak: " + $maxDown + " KB/s") -ForegroundColor Cyan
    Write-Host ("Upload Speed   : " + $upKB + " KB/s  (" + [math]::Round($upKB / 1024, 2) + " MB/s)   Peak: " + $maxUp + " KB/s") -ForegroundColor Yellow

    Write-Host ("Total Download : " + [math]::Round($totalDown, 2) + " KB")
    Write-Host ("Total Upload   : " + [math]::Round($totalUp, 2) + " KB")

    Write-Host ""

    Write-Host "Download Meter" -ForegroundColor Cyan
    Write-Host (Draw-Bar $downKB $maxDown "#")

    Write-Host "Upload Meter" -ForegroundColor Yellow
    Write-Host (Draw-Bar $upKB $maxUp "=")

    Write-Host ""
    Write-Host "Turbo traffic active (Hutch refresh running)"
    Write-Host "Press CTRL + C to stop"

    Write-Host "==================================================" -ForegroundColor Green

}