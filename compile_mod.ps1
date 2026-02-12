$ErrorActionPreference = "Continue"

Write-Host "--- NGU Live Sync Compiler v12 (Code Cleanup) ---"

# Caminhos
$managed = "C:\PROGRA~2\steam\steamapps\common\NGU Idle\NGUIdle_Data\Managed"
$bep = "C:\PROGRA~2\steam\steamapps\common\NGU Idle\BepInEx\core"
$out = Join-Path (Get-Location) "public\NGULiveSync.dll"
$csFile = Join-Path (Get-Location) "build_mod\NGULiveSync.cs"

if (!(Test-Path "build_mod")) { New-Item -ItemType Directory -Path "build_mod" }
if (Test-Path $out) { Remove-Item $out -Force }

Write-Host "Writing C# code..."

Write-Host "Using existing C# file: $csFile"

Write-Host "Compiling..."
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$refs = @(
    "/r:`"$managed\UnityEngine.dll`"",
    "/r:`"$managed\UnityEngine.CoreModule.dll`"",
    "/r:`"$managed\Assembly-CSharp.dll`"",
    "/r:`"$managed\Assembly-CSharp-firstpass.dll`"",
    "/r:`"$bep\BepInEx.dll`"",
    "/r:`"$bep\0Harmony.dll`"",
    "/r:System.dll",
    "/r:System.Core.dll"
)

$json = "C:\Users\Leonardo\.nuget\packages\newtonsoft.json\10.0.3\lib\net20\Newtonsoft.Json.dll"
if (!(Test-Path $json)) { $json = "C:\Users\Leonardo\.nuget\packages\newtonsoft.json\13.0.1\lib\net45\Newtonsoft.Json.dll" }
if (Test-Path $json) { $refs += "/r:`"$json`"" }

$compileArgs = @("/target:library", "/out:`"$out`"") + $refs + "`"$csFile`""

Start-Process -FilePath $csc -ArgumentList $compileArgs -Wait -NoNewWindow

if (Test-Path $out) {
    Write-Host "✅ SUCESSO! DLL v12 gerada." -ForegroundColor Green
    Copy-Item $json -Destination (Join-Path (Get-Location) "public\Newtonsoft.Json.dll") -Force
    Write-Host "Copied Newtonsoft.Json.dll to public folder." -ForegroundColor Gray
}
else {
    Write-Host "❌ Falha na compilação." -ForegroundColor Red
}
